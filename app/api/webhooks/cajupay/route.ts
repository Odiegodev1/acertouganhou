import { NextRequest, NextResponse } from "next/server"
import { createHash } from "node:crypto"

import prisma from "@/lib/prisma"
import { verifyCajuPayWebhook } from "@/lib/verify-cajupay-webhook"
import { creditCajuPayDeposit } from "@/lib/payments/credit-cajupay-deposit"


interface CajuPayWebhook {
  id: string
  type: string
  data: {
    object: {
      cajupay_payment_id: string
      amount_cents: number
      currency: string
      status: string
    }
  }
}

export async function POST(request: NextRequest) {
  // 1. Ler conteúdo original
  const rawBody = await request.text()

  // 2. Validar assinatura
  const signature = request.headers.get(
    "x-cajupay-signature"
  )

  if (!verifyCajuPayWebhook(rawBody, signature)) {
    return NextResponse.json(
      { error: "Assinatura inválida" },
      { status: 401 }
    )
  }

  // 3. Interpretar JSON
  let event: CajuPayWebhook

  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      { error: "JSON inválido" },
      { status: 400 }
    )
  }

  if (!event.id || typeof event.type !== "string") {
    return NextResponse.json(
      { error: "Evento inválido" },
      { status: 422 }
    )
  }

  // 4. Outros eventos precisam de tratamento separado
  if (event.type !== "pix.payment.paid") {
    console.info("[CAJUPAY_EVENT_IGNORED]", {
      eventType: event.type,
    })

    return NextResponse.json({
      received: true,
      processed: false,
    })
  }

  const payment = event.data?.object

  if (
    !payment ||
    typeof payment.cajupay_payment_id !== "string" ||
    !Number.isSafeInteger(payment.amount_cents) ||
    typeof payment.currency !== "string" ||
    typeof payment.status !== "string"
  ) {
    return NextResponse.json(
      { error: "Dados inválidos" },
      { status: 422 }
    )
  }

  // 5. Identificador para auditoria
  const eventHash = createHash("sha256")
    .update(`CAJUPAY:${event.id}`)
    .digest("hex")

  try {
    // 6. Confirmar pagamento e creditar carteira
    const result = await creditCajuPayDeposit({
      paymentId: payment.cajupay_payment_id,
      amountCents: payment.amount_cents,
      currency: payment.currency,
      status: payment.status,
    })

    // 7. Registrar evento processado
    // Auditoria não deve causar novo crédito em retries.
    await prisma.paymentWebhookEvent.upsert({
      where: {
        eventHash,
      },
      create: {
        provider: "CAJUPAY",
        eventType: event.type,
        transactionId: payment.cajupay_payment_id,
        eventHash,
        status: "PROCESSED",
        payload: JSON.parse(rawBody),
        processedAt: new Date(),
      },
      update: {
        status: "PROCESSED",
        processedAt: new Date(),
      },
    })

    console.info("[CAJUPAY_DEPOSIT_PROCESSED]", {
      depositId: result.depositId,
      credited: result.credited,
    })

    return NextResponse.json({
      received: true,
      processed: true,
      credited: result.credited,
      alreadyCredited: result.alreadyCredited,
    })
  } catch (error) {
    console.error("[CAJUPAY_WEBHOOK_ERROR]", {
      eventId: event.id,
      error:
        error instanceof Error
          ? error.message
          : "UNKNOWN_ERROR",
    })

    // Não confirmar entrega enquanto o crédito falhar.
    return NextResponse.json(
      { error: "Falha ao processar pagamento" },
      { status: 503 }
    )
  }
}