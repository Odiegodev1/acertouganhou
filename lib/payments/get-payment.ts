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
    const account = await prisma.paymentAccount.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        availableBalance: true,
        reservedBalance: true,
      },
    })

    return {
      success: true as const,
      availableBalance: account?.availableBalance ?? 0,
      reservedBalance: account?.reservedBalance ?? 0,
    }
  } catch (error) {
    console.error("[GET_PAYMENT_BALANCE]", error)

    return {
      success: false as const,
      error: "Erro ao consultar saldo.",
    }
  }
}