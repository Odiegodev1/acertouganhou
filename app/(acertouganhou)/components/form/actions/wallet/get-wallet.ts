"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"



export async function getWallet() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Faça login para continuar.",
    }
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    select: { balance: true },
  })

  return {
    success: true as const,
    balance: wallet?.balance ?? 0,
  }
}