import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import {
  createCajuPayPix,
  CajuPayError,
} from "@/lib/payments/cajupay";



const depositSchema = z.object({
  amount: z.number().int().min(1000).max(1000000),
});

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Autenticação
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse("Faça login para continuar.", 401);
    }

    if (process.env.PAYMENTS_ENABLED !== "true") {
      return errorResponse("Depósitos desabilitados.", 503);
    }

    // 2. Validar valor
    const body: unknown = await request.json().catch(() => null);

    const parsed = depositSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Valor inválido. Mínimo R$ 10,00 e máximo R$ 10.000,00.",
        422,
      );
    }

    const userId = session.user.id;

    // 3. Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        cpf: true,
        phone: true,
      },
    });

    if (!user?.name || !user.email || !user.cpf || !user.phone) {
      return errorResponse(
        "Complete nome, e-mail, CPF e telefone no cadastro.",
        422,
      );
    }

    // 4. Configurar checkout
    let checkoutUrl: string;

    try {
      const appUrl = new URL(process.env.APP_URL || "");

      if (
        appUrl.protocol !== "https:" ||
        appUrl.username ||
        appUrl.password
      ) {
        return errorResponse("APP_URL inválida.", 503);
      }

      checkoutUrl = new URL("/carteira", appUrl).toString();
    } catch {
      return errorResponse(
        "APP_URL deve ser uma URL HTTPS válida.",
        503,
      );
    }

    // 5. Verificar cobranças incertas
    const uncertain = await prisma.paymentDeposit.count({
      where: {
        userId,
        status: "RECONCILIATION_REQUIRED",
      },
    });

    if (uncertain > 0) {
      return errorResponse(
        "Existe uma cobrança aguardando verificação. Consulte o suporte.",
        409,
      );
    }

    // 6. Limitar cobranças pendentes
    const pending = await prisma.paymentDeposit.count({
      where: {
        userId,
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
    });

    if (pending >= 5) {
      return errorResponse(
        "Você já possui cinco cobranças pendentes.",
        429,
      );
    }

    // 7. Criar depósito local
    const deposit = await prisma.paymentDeposit.create({
      data: {
        userId,
        amount: parsed.data.amount,
        status: "PENDING",
      },
    });

    console.info("[CREATE_DEPOSIT]", {
      depositId: deposit.id,
      amount: deposit.amount,
    });

    // 8. Solicitar Pix à CajuPay
    try {
      const payment = await createCajuPayPix({
        depositId: deposit.id,
        amountCents: deposit.amount,
        checkoutUrl,
        customer: {
          name: user.name,
          email: user.email,
          document: user.cpf,
          phone: user.phone,
        },
      });

      // 9. Salvar pagamento
      await prisma.paymentDeposit.update({
        where: {
          id: deposit.id,
        },
        data: {
          providerTransactionId: payment.payment_id,
          pixCopyPaste: payment.pix_copy_paste ?? null,
          pixQrCode: payment.pix_qr_code ?? null,
          status: "PROCESSING",
        },
      });

      console.info("[DEPOSIT_CREATED]", {
        depositId: deposit.id,
        paymentId: payment.payment_id,
      });

      // 10. Retornar sucesso
      return NextResponse.json(
        {
          success: true,
          mode: "PIX",
          provider: "CAJUPAY",
          deposit: {
            id: deposit.id,
            amount: deposit.amount,
            status: "PROCESSING",
            providerTransactionId: payment.payment_id,
            pixCopyPaste: payment.pix_copy_paste ?? null,
            pixQrCode: payment.pix_qr_code ?? null,
          },
        },
        {
          status: 201,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    } catch (error) {
      const definitive =
        error instanceof CajuPayError && error.definitive;

      // Nunca marcar como FAILED uma cobrança de resultado incerto.
      try {
        await prisma.paymentDeposit.updateMany({
          where: {
            id: deposit.id,
            status: "PENDING",
            providerTransactionId: null,
          },
          data: {
            status: definitive
              ? "FAILED"
              : "RECONCILIATION_REQUIRED",
          },
        });
      } catch (databaseError) {
        console.error("[DEPOSIT_STATUS_ERROR]", {
          depositId: deposit.id,
          error:
            databaseError instanceof Error
              ? databaseError.message
              : "UNKNOWN",
        });
      }

      console.error("[CAJUPAY_DEPOSIT_ERROR]", {
        depositId: deposit.id,
        code:
          error instanceof CajuPayError
            ? error.code
            : "UNKNOWN",
        providerStatus:
          error instanceof CajuPayError
            ? error.statusCode
            : null,
        requestId:
          error instanceof CajuPayError
            ? error.requestId
            : null,
      });

      return errorResponse(
        definitive
          ? "A CajuPay rejeitou os dados da cobrança."
          : "Não foi possível confirmar a criação do Pix. Aguarde a verificação.",
        definitive ? 422 : 502,
      );
    }
  } catch (error) {
    console.error("[CREATE_DEPOSIT_ERROR]", {
      message:
        error instanceof Error ? error.message : "UNKNOWN",
    });

    return errorResponse(
      "Erro interno ao criar depósito.",
      500,
    );
  }
}