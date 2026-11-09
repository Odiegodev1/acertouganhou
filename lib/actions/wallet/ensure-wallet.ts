import "server-only"

import prisma from "@/lib/prisma"

export async function ensureWallet(userId: string) {
  if (!userId) {
    throw new Error("USER_ID_REQUIRED")
  }

  const wallet = await prisma.wallet.upsert({
    where: {
      userId,
    },
    update: {},
    create: {
      userId,
      balance: 0,
    },
  })

  return wallet
}