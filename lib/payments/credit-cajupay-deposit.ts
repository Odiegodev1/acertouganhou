import "server-only"

import prisma from "@/lib/prisma"

interface CreditDepositInput {
  paymentId: string
  amountCents: number
  currency: string
  status: string
}

export async function creditCajuPayDeposit({
  paymentId,
  amountCents,
  currency,
  status,
}: CreditDepositInput) {
  if (
    !paymentId ||
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0 ||
    currency.toUpperCase() !== "BRL" ||
    status.toLowerCase() !== "paid"
  ) {
    throw new Error("INVALID_PAYMENT_DATA")
  }

  return prisma.$transaction(async (tx) => {
    // 1. Localizar cobrança pelo identificador CajuPay
    const deposit = await tx.paymentDeposit.findUnique({
      where: {
        providerTransactionId: paymentId,
      },
    })

    if (!deposit) {
      throw new Error("DEPOSIT_NOT_FOUND")
    }

    // 2. Conferir valor original
    if (deposit.amount !== amountCents) {
      throw new Error("AMOUNT_MISMATCH")
    }

    // 3. Já creditado anteriormente
    if (deposit.creditedAt) {
      return {
        credited: false,
        alreadyCredited: true,
        depositId: deposit.id,
      }
    }

    // 4. Não creditar depósitos cancelados/reembolsados
    if (
      !["PENDING", "PROCESSING", "PAID"].includes(
        deposit.status
      )
    ) {
      throw new Error("INVALID_DEPOSIT_STATUS")
    }

    const now = new Date()

    // 5. Reservar o direito de creditar este depósito
    const claimed = await tx.paymentDeposit.updateMany({
      where: {
        id: deposit.id,
        creditedAt: null,
        status: {
          in: ["PENDING", "PROCESSING", "PAID"],
        },
      },
      data: {
        status: "PAID",
        paidAt: deposit.paidAt ?? now,
        creditedAt: now,
      },
    })

    // Somente uma execução pode vencer essa condição
    if (claimed.count !== 1) {
      return {
        credited: false,
        alreadyCredited: true,
        depositId: deposit.id,
      }
    }

    // 6. Creditar carteira real
    await tx.paymentAccount.upsert({
      where: {
        userId: deposit.userId,
      },
      create: {
        userId: deposit.userId,
        availableBalance: deposit.amount,
        reservedBalance: 0,
      },
      update: {
        availableBalance: {
          increment: deposit.amount,
        },
      },
    })

    return {
      credited: true,
      alreadyCredited: false,
      depositId: deposit.id,
      amountCents: deposit.amount,
    }
  })
}