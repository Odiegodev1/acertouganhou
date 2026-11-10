import "server-only"

import prisma from "@/lib/prisma"

export async function ensurePaymentAccount(userId: string) {
  if (!userId) {
    throw new Error("USER_ID_REQUIRED")
  }

  return prisma.paymentAccount.upsert({
    where: {
      userId,
    },
    update: {},
    create: {
      userId,
      availableBalance: 0,
      reservedBalance: 0,
    },
  })
}