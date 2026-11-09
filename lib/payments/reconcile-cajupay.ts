import "server-only"

import prisma from "@/lib/prisma"
import { creditCajuPayDeposit } from "@/lib/payments/credit-cajupay-deposit"

interface CajuPayPayment {
  payment_id: string
  amount_cents: number
  currency: string
  status: string
}

export async function reconcileCajuPayDeposits() {
  const apiKey = process.env.CAJUPAY_API_KEY
  const apiSecret = process.env.CAJUPAY_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error("Credenciais CajuPay não configuradas")
  }

  // Inclui pagamentos antigos para recuperar o Pix já realizado.
  // Depois podemos reduzir a janela para 12 horas.
  const cutoff = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  )

  const deposits = await prisma.paymentDeposit.findMany({
    where: {
      status: {
        in: ["PENDING", "PROCESSING", "PAID"],
      },
      creditedAt: null,
      providerTransactionId: {
        not: null,
      },
      createdAt: {
        gte: cutoff,
      },
    },
    select: {
      id: true,
      amount: true,
      providerTransactionId: true,
    },
    take: 100,
    orderBy: {
      createdAt: "desc",
    },
  })

  if (deposits.length === 0) {
    return {
      checked: 0,
      credited: 0,
      message: "Nenhum depósito pendente",
    }
  }

  // Consultar a CajuPay no servidor
  const response = await fetch(
    "https://api.cajupay.com.br/api/payments?limit=100",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    }
  )

  if (!response.ok) {
    console.error("[CAJUPAY_RECONCILE_HTTP]", response.status)
    throw new Error("Falha ao consultar pagamentos na CajuPay")
  }

  const data: unknown = await response.json()

  // A documentação descreve uma lista de pagamentos.
  if (!Array.isArray(data)) {
    throw new Error(
      "Formato inesperado da listagem CajuPay. Reconciliação interrompida."
    )
  }

  const payments = new Map<string, CajuPayPayment>()

  for (const item of data) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof item.payment_id === "string" &&
      typeof item.amount_cents === "number" &&
      typeof item.currency === "string" &&
      typeof item.status === "string"
    ) {
      payments.set(item.payment_id, item as CajuPayPayment)
    }
  }

  let credited = 0
  let alreadyCredited = 0
  let notFound = 0
  let errors = 0

  for (const deposit of deposits) {
    const payment = payments.get(
      deposit.providerTransactionId!
    )

    if (!payment) {
      notFound++
      continue
    }

    if (payment.status.toLowerCase() !== "paid") {
      continue
    }

    // Conferir valor antes de qualquer crédito
    if (
      payment.amount_cents !== deposit.amount ||
      payment.currency.toUpperCase() !== "BRL"
    ) {
      console.error("[CAJUPAY_RECONCILE_MISMATCH]", {
        depositId: deposit.id,
      })

      errors++
      continue
    }

    try {
      const result = await creditCajuPayDeposit({
        paymentId: payment.payment_id,
        amountCents: payment.amount_cents,
        currency: payment.currency,
        status: payment.status,
      })

      if (result.credited) {
        credited++

        console.info("[CAJUPAY_RECONCILED]", {
          depositId: deposit.id,
          amountCents: deposit.amount,
        })
      } else {
        alreadyCredited++
      }
    } catch (error) {
      errors++

      console.error("[CAJUPAY_RECONCILE_ERROR]", {
        depositId: deposit.id,
        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN_ERROR",
      })
    }
  }

  return {
    checked: deposits.length,
    credited,
    alreadyCredited,
    notFound,
    errors,
  }
}