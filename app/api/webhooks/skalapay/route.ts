import { NextRequest, NextResponse } from "next/server"
import { createHash, timingSafeEqual } from "node:crypto"



import {
  getSkalaPayCashIn,
} from "@/lib/payments/skalapay"
import prisma from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"



// ======================================================
// TIPOS
// ======================================================

type WebhookPayload = Record<string, unknown>

type ProviderStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "CHARGEBACK"

// ======================================================
// HELPERS
// ======================================================

function json(
  data: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(data, { status })
}

function verifyToken(received: string | null) {
  const expected =
    process.env.SKALAPAY_WEBHOOK_SECRET

  if (!expected || expected.length < 32 || !received) {
    return false
  }

  const receivedBuffer = Buffer.from(received)
  const expectedBuffer = Buffer.from(expected)

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  )
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  )
}

function getTransactionId(
  payload: WebhookPayload
): string | null {
  // Adaptar aos campos documentados pela SkalaPay.
  const transaction = isRecord(payload.transaction)
    ? payload.transaction
    : null

  const candidate =
    transaction?.id ??
    payload.transaction_id ??
    payload.transactionId

  if (
    typeof candidate === "string" &&
    candidate.trim()
  ) {
    return candidate
  }

  if (
    typeof candidate === "number" &&
    Number.isSafeInteger(candidate)
  ) {
    return String(candidate)
  }

  return null
}

function getEventType(payload: WebhookPayload) {
  const value =
    payload.event_type ??
    payload.event ??
    payload.type

  return typeof value === "string"
    ? value.slice(0, 100)
    : "UNKNOWN"
}

function parseProviderAmount(
  amount: number | undefined
): number | null {
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null
  }

  // O cliente atual envia valores em reais ao provedor.
  // Confirmar que a consulta também retorna reais.
  const cents = Math.round(amount * 100)

  if (
    !Number.isSafeInteger(cents) ||
    Math.abs(amount * 100 - cents) > 0.001
  ) {
    return null
  }

  return cents
}

// ======================================================
// POST — WEBHOOK SKALAPAY
// ======================================================

export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // 1. AUTENTICAR CALLBACK
    // --------------------------------------------------

    const token =
      request.nextUrl.searchParams.get("token")

    if (!verifyToken(token)) {
      return json(
        {
          success: false,
          error: "Não autorizado.",
        },
        401
      )
    }

    // --------------------------------------------------
    // 2. VERIFICAR AMBIENTE
    // --------------------------------------------------

    if (
      process.env.PAYMENTS_ENABLED !== "true" ||
      process.env.PAYMENTS_ENV !== "sandbox"
    ) {
      return json(
        {
          success: false,
          error: "Integração desabilitada.",
        },
        503
      )
    }

    // --------------------------------------------------
    // 3. LER PAYLOAD
    // --------------------------------------------------

    const rawBody = await request.text()

    if (Buffer.byteLength(rawBody, "utf8") > 65536) {
      return json(
        {
          success: false,
          error: "Payload muito grande.",
        },
        413
      )
    }

    let parsed: unknown

    try {
      parsed = JSON.parse(rawBody)
    } catch {
      return json(
        {
          success: false,
          error: "JSON inválido.",
        },
        400
      )
    }

    if (!isRecord(parsed)) {
      return json(
        {
          success: false,
          error: "Payload inválido.",
        },
        400
      )
    }

    const payload = parsed

    // --------------------------------------------------
    // 4. EXTRAIR TRANSAÇÃO
    // --------------------------------------------------

    const transactionId = getTransactionId(payload)

    if (!transactionId) {
      return json(
        {
          success: false,
          error: "Transação não identificada.",
        },
        422
      )
    }

    // --------------------------------------------------
    // 5. LOCALIZAR DEPÓSITO
    // --------------------------------------------------

    const deposit =
      await prisma.paymentDeposit.findUnique({
        where: {
          providerTransactionId: transactionId,
        },
      })

    if (!deposit) {
      // Pode ocorrer se o callback chegar antes de
      // a rota de depósito salvar o ID externo.
      // Retornar 503 permite nova tentativa,
      // caso o provedor suporte retries.
      return json(
        {
          success: false,
          error: "Depósito ainda não localizado.",
        },
        503
      )
    }

    // --------------------------------------------------
    // 6. CONSULTAR DIRETAMENTE O PROVEDOR
    // --------------------------------------------------

    const providerResponse =
      await getSkalaPayCashIn(transactionId)

    const transaction = providerResponse.transaction

    if (!transaction) {
      return json(
        {
          success: false,
          error: "Transação não encontrada no provedor.",
        },
        502
      )
    }

    if (String(transaction.id) !== transactionId) {
      return json(
        {
          success: false,
          error: "Identificador divergente.",
        },
        409
      )
    }

    const providerStatus =
      transaction.status as ProviderStatus

    // --------------------------------------------------
    // 7. CONFERIR VALOR
    // --------------------------------------------------

    const providerAmountCents =
      parseProviderAmount(transaction.amount)

    if (
      providerAmountCents === null ||
      providerAmountCents !== deposit.amount
    ) {
      console.error("[WEBHOOK_AMOUNT_MISMATCH]", {
        depositId: deposit.id,
        transactionId,
      })

      return json(
        {
          success: false,
          error: "Valor da transação não confirmado.",
        },
        409
      )
    }

    // --------------------------------------------------
    // 8. REGISTRAR EVENTO
    // --------------------------------------------------

    const eventHash = createHash("sha256")
      .update(rawBody)
      .digest("hex")

    const existingEvent =
      await prisma.paymentWebhookEvent.findUnique({
        where: {
          eventHash,
        },
      })

    if (
      existingEvent?.status === "PROCESSED"
    ) {
      return json({
        success: true,
        duplicate: true,
      })
    }

    const eventType = getEventType(payload)

    if (!existingEvent) {
        await prisma.paymentWebhookEvent.create({
            data: {
              provider: "SKALAPAY",
              eventType,
              transactionId,
              eventHash,
              status: "RECEIVED",
          
              payload: JSON.parse(rawBody) as Prisma.InputJsonValue,
            },
          })
    }

    // --------------------------------------------------
    // 9. ATUALIZAR STATUS DO DEPÓSITO
    // --------------------------------------------------

    if (providerStatus === "PAID") {
      const paidAt =
        transaction.paid_at &&
        !Number.isNaN(
          new Date(transaction.paid_at).getTime()
        )
          ? new Date(transaction.paid_at)
          : new Date()

      await prisma.paymentDeposit.updateMany({
        where: {
          id: deposit.id,
          status: {
            in: ["PENDING", "PROCESSING"],
          },
        },
        data: {
          status: "PAID",
          paidAt,
        },
      })
    } else if (
      providerStatus === "PROCESSING"
    ) {
      await prisma.paymentDeposit.updateMany({
        where: {
          id: deposit.id,
          status: "PENDING",
        },
        data: {
          status: "PROCESSING",
        },
      })
    }

    // Estados de estorno, chargeback e falha
    // exigem tratamento próprio. Não modificar
    // automaticamente um depósito PAID.

    // --------------------------------------------------
    // 10. MARCAR EVENTO COMO PROCESSADO
    // --------------------------------------------------

    await prisma.paymentWebhookEvent.update({
      where: {
        eventHash,
      },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
      },
    })

    console.info("[SKALAPAY_WEBHOOK]", {
      depositId: deposit.id,
      transactionId,
      providerStatus,
    })

    return json({
      success: true,
      received: true,
    })
  } catch (error) {
    console.error("[SKALAPAY_WEBHOOK_ERROR]", error)

    return json(
      {
        success: false,
        error: "Falha ao processar notificação.",
      },
      500
    )
  }
}