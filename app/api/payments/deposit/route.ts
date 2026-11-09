import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

import {
  createCajuPayPix,
  CajuPayError,
} from "@/lib/payments/cajupay"



// ==========================================
// VALIDAÇÃO
// ==========================================

const depositSchema = z.object({
  amount: z
    .number()
    .int()
    .min(1000, "Depósito mínimo de R$ 10,00.")
    .max(
      1000000,
      "Depósito máximo de R$ 10.000,00."
    ),
})

// ==========================================
// RESPOSTA DE ERRO
// ==========================================

function jsonError(message: string, status: number) {
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
    }
  )
}

// ==========================================
// VALIDAR URL DO CHECKOUT
// ==========================================

function getCheckoutUrl(): string | null {
  const appUrl = process.env.APP_URL

  if (!appUrl) {
    return null
  }

  try {
    const baseUrl = new URL(appUrl)

    if (baseUrl.protocol !== "https:") {
      return null
    }

    if (
      baseUrl.username ||
      baseUrl.password ||
      !baseUrl.hostname
    ) {
      return null
    }

    const checkoutUrl = new URL(
      "/carteira",
      baseUrl
    )

    return checkoutUrl.toString()
  } catch {
    return null
  }
}

// ==========================================
// CRIAR DEPÓSITO PIX
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // ==========================================
    // 1. AUTENTICAÇÃO
    // ==========================================

    const session = await auth()

    if (!session?.user?.id) {
      return jsonError(
        "Você precisa estar logado.",
        401
      )
    }

    const userId = session.user.id

    // ==========================================
    // 2. VERIFICAR CONFIGURAÇÃO
    // ==========================================

    if (process.env.PAYMENTS_ENABLED !== "true") {
      return jsonError(
        "Depósitos indisponíveis.",
        503
      )
    }

    if (
      !process.env.CAJUPAY_API_KEY ||
      !process.env.CAJUPAY_API_SECRET
    ) {
      console.error(
        "[CAJUPAY_CONFIG] Credenciais ausentes."
      )

      return jsonError(
        "Gateway de pagamento não configurado.",
        503
      )
    }

    // ==========================================
    // 3. VALIDAR JSON
    // ==========================================

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return jsonError(
        "JSON inválido.",
        400
      )
    }

    const parsed = depositSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Valor inválido.",
          details: parsed.error.flatten(),
        },
        {
          status: 422,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      )
    }

    const { amount } = parsed.data

    // ==========================================
    // 4. CONSULTAR USUÁRIO
    // ==========================================

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
    })

    if (!user) {
      return jsonError(
        "Usuário não encontrado.",
        404
      )
    }

    // ==========================================
    // 5. VALIDAR CADASTRO
    // ==========================================

    const name = user.name?.trim()
    const email = user.email?.trim()
    const cpf = user.cpf?.replace(/\D/g, "")
    const phone = user.phone?.replace(/\D/g, "")

    if (
      !name ||
      !email ||
      !cpf ||
      !phone
    ) {
      return jsonError(
        "Complete seu cadastro antes de depositar.",
        422
      )
    }

    if (!/^\d{11}$/.test(cpf)) {
      return jsonError(
        "CPF inválido. Atualize seu cadastro.",
        422
      )
    }

    // Aceita telefone nacional de 10 ou 11 dígitos
    // ou telefone brasileiro com DDI 55.
    const nationalPhone = phone.startsWith("55")
      ? phone.slice(2)
      : phone

    if (!/^\d{10,11}$/.test(nationalPhone)) {
      return jsonError(
        "Telefone inválido. Atualize seu cadastro.",
        422
      )
    }

    const normalizedPhone = `+55${nationalPhone}`

    // ==========================================
    // 6. LIMITAR DEPÓSITOS PENDENTES
    // ==========================================

    const pendingCount =
      await prisma.paymentDeposit.count({
        where: {
          userId,

          status: {
            in: ["PENDING", "PROCESSING"],
          },
        },
      })

    if (pendingCount >= 5) {
      return jsonError(
        "Você possui muitos depósitos pendentes. Aguarde a confirmação ou expiração das cobranças anteriores.",
        429
      )
    }

    // ==========================================
    // 7. VALIDAR URL DO CHECKOUT
    // ==========================================

    const checkoutUrl = getCheckoutUrl()

    if (!checkoutUrl) {
      console.error(
        "[CAJUPAY_CONFIG] APP_URL inválida."
      )

      return jsonError(
        "URL de checkout não configurada corretamente.",
        503
      )
    }

    // ==========================================
    // 8. CRIAR DEPÓSITO LOCAL
    // ==========================================

    const deposit =
      await prisma.paymentDeposit.create({
        data: {
          userId,
          amount,
          status: "PENDING",
        },
      })

    // ==========================================
    // 9. CRIAR COBRANÇA NA CAJUPAY
    // ==========================================

    try {
      console.info("[CAJUPAY_CREATE_START]", {
        depositId: deposit.id,
        amountCents: amount,
        checkoutHost: new URL(
          checkoutUrl
        ).hostname,
      })

      const payment = await createCajuPayPix({
        amountCents: amount,

        depositId: deposit.id,

        checkoutUrl,

        customer: {
          name,
          email,
          document: cpf,
          phone: normalizedPhone,
        },
      })

      // ==========================================
      // 10. VALIDAR RESPOSTA
      // ==========================================

      if (!payment.payment_id) {
        throw new Error(
          "A CajuPay não retornou o identificador da cobrança."
        )
      }

      // ==========================================
      // 11. SALVAR COBRANÇA
      // ==========================================

      await prisma.paymentDeposit.update({
        where: {
          id: deposit.id,
        },

        data: {
          providerTransactionId:
            payment.payment_id,

          pixCopyPaste:
            payment.pix_copy_paste ?? null,
        },
      })

      console.info("[CAJUPAY_CREATE_SUCCESS]", {
        depositId: deposit.id,
        providerTransactionId:
          payment.payment_id,
      })

      // ==========================================
      // 12. RETORNAR PIX
      // ==========================================

      return NextResponse.json(
        {
          success: true,

          mode: "PIX",

          provider: "CAJUPAY",

          message:
            "Cobrança Pix criada com sucesso.",

          deposit: {
            id: deposit.id,
            amount: deposit.amount,
            status: "PENDING",

            createdAt:
              deposit.createdAt.toISOString(),

            providerTransactionId:
              payment.payment_id,

            pixCopyPaste:
              payment.pix_copy_paste ?? null,
          },
        },
        {
          status: 201,

          headers: {
            "Cache-Control": "no-store",
          },
        }
      )
    } catch (error) {
      // ==========================================
      // 13. TRATAR ERRO DO PROVEDOR
      // ==========================================

      const isProviderError =
        error instanceof CajuPayError

      const statusCode = isProviderError
        ? error.statusCode
        : null

      const errorCode = isProviderError
        ? error.code
        : "UNEXPECTED_ERROR"

      console.error("[CAJUPAY_CREATE_PIX]", {
        depositId: deposit.id,

        error: {
          status: statusCode,
          code: errorCode,
        },
      })

      // ==========================================
      // 14. CLASSIFICAR RESULTADO
      // ==========================================

      /*
       * Uma falha de validação claramente documentada
       * pode indicar que a cobrança foi rejeitada.
       *
       * Erros genéricos, timeout ou falhas de rede
       * não provam que a cobrança deixou de existir.
       */

      const definitiveRejectionCodes = new Set([
        "invalid_amount",
        "below_minimum_charge_amount",
        "missing_idempotency_key",
        "invalid_partner_checkout_url",
        "https_required",
        "idempotency_key_reuse_mismatch",
      ])

      const definitivelyRejected =
        isProviderError &&
        statusCode === 400 &&
        definitiveRejectionCodes.has(errorCode)

      if (definitivelyRejected) {
        await prisma.paymentDeposit.updateMany({
          where: {
            id: deposit.id,
            status: "PENDING",
            providerTransactionId: null,
          },

          data: {
            status: "FAILED",
          },
        })
      }

      // ==========================================
      // 15. ERROS ESPECÍFICOS
      // ==========================================

      if (statusCode === 401) {
        return jsonError(
          "A CajuPay recusou as credenciais de pagamento.",
          502
        )
      }

      if (statusCode === 403) {
        return jsonError(
          "A chave de pagamento não possui permissão para criar cobranças Pix.",
          502
        )
      }

      if (
        errorCode === "PROVIDER_NON_JSON_ERROR"
      ) {
        return jsonError(
          "A CajuPay não conseguiu criar a cobrança Pix. A solicitação foi registrada para verificação.",
          502
        )
      }

      if (statusCode === 429) {
        return jsonError(
          "O serviço de pagamentos está ocupado. Aguarde antes de tentar novamente.",
          503
        )
      }

      return jsonError(
        "Não foi possível confirmar a criação da cobrança. Verifique seu histórico antes de tentar novamente.",
        502
      )
    }
  } catch (error) {
    console.error("[CREATE_DEPOSIT]", error)

    return jsonError(
      "Erro interno ao criar depósito.",
      500
    )
  }
}