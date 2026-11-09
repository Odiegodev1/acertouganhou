"use server"

import { auth } from "@/lib/auth"
import { z } from "zod"

const depositSchema = z.object({
  amount: z.number().int().min(1000).max(1000000),
})

export async function createDeposit(amount: number) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Faça login para continuar.",
    }
  }

  const parsed = depositSchema.safeParse({ amount })

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Informe um valor entre R$ 10,00 e R$ 10.000,00.",
    }
  }

  return {
    success: true as const,
    mode: "PREVIEW" as const,
    amount: parsed.data.amount,
    message:
      "Prévia validada. A geração de cobranças Pix está desabilitada.",
  }
}