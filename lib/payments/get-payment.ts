"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function getPaymentBalance() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Faça login para continuar.",
    }
  }

  try {
    const account = await prisma.wallet.findUnique({
      where: {
        userId: session.user.id,
      },
      select:{
        balance: true
      }
    })

    return {
      success: true as const,
      availableBalance: account?.balance ?? 0,
      reservedBalance: account?.balance ?? 0,
    }
  } catch (error) {
    console.error("[GET_PAYMENT_BALANCE]", error)

    return {
      success: false as const,
      error: "Erro ao consultar saldo.",
    }
  }
}