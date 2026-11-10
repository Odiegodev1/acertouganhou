"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function getPaymentBalance() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false as const,
      balance: 0,
      reservedBalance: 0,
      error: "Faça login para continuar.",
    }
  }

  const userId = session.user.id

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscar saldo financeiro
      const account = await tx.paymentAccount.findUnique({
        where: {
          userId,
        },
        select: {
          availableBalance: true,
          reservedBalance: true,
        },
      })

      if (!account) {
        throw new Error("PAYMENT_ACCOUNT_NOT_FOUND")
      }

      // 2. Sincronizar o saldo com a Wallet
      const wallet = await tx.wallet.upsert({
        where: {
          userId,
        },
        create: {
          userId,
          balance: account.availableBalance,
        },
        update: {
          balance: account.availableBalance,
        },
        select: {
          balance: true,
        },
      })

      // 3. Retornar o saldo da Wallet
      return {
        balance: wallet.balance,
        reservedBalance: account.reservedBalance,
      }
    })

    return {
      success: true as const,
      balance: result.balance,
      reservedBalance: result.reservedBalance,
    }
  } catch (error) {
    console.error("[SYNC_PAYMENT_WALLET_ERROR]", {
      message:
        error instanceof Error
          ? error.message
          : "UNKNOWN_ERROR",
    })

    return {
      success: false as const,
      balance: 0,
      reservedBalance: 0,
      error: "Não foi possível sincronizar a carteira.",
    }
  }
}