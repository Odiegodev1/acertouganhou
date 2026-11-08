"use server"

import { auth } from "@/lib/auth"
import  prisma  from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  amount: z
    .number()
    .int()
    .min(1000)
    .max(1000000),
})

export async function addDemoBalance(amount: number) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Você precisa estar logado.",
    }
  }

  const parsed = schema.safeParse({ amount })

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Valor inválido.",
    }
  }

  const userId = session.user.id

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId },
      create: {
        userId,
        balance: 0,
      },
      update: {},
    })

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: parsed.data.amount,
        },
      },
    })

    await tx.walletTransaction.create({
      data: {
        userId,
        type: "DEMO_CREDIT",
        amount: parsed.data.amount,
        balanceAfter: updated.balance,
        description: "Recarga de demonstração",
      },
    })

    return updated
  })

  revalidatePath("/carteira")

  return {
    success: true as const,
    balance: result.balance,
  }
}