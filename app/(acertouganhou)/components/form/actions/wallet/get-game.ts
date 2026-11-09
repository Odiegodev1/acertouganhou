"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function getGameWalletBalance() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false as const,
        error: "Faça login para continuar.",
      }
    }

    // Criar carteira caso não exista
    const wallet = await prisma.wallet.upsert({
      where: {
        userId: session.user.id,
      },
      update: {},
      create: {
        userId: session.user.id,
        balance: 0,
      },
      select: {
        balance: true,
      },
    })

    return {
      success: true as const,
      balance: wallet.balance,
    }
  } catch (error) {
    console.error("[GET_GAME_WALLET_BALANCE]", error)

    return {
      success: false as const,
      error: "Erro ao consultar carteira.",
    }
  }
}