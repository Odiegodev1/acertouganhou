"use server"

import  prisma from "@/lib/prisma"

export async function getGame(prizeId: string) {
  const prize = await prisma.prize.findUnique({
    where: { id: prizeId },
    select: {
      id: true,
      name: true,
      value: true,
      playCost: true,
      targetMs: true,
      speedFactor: true,
      active: true,
      stock: true,
    },
  })

  if (!prize || !prize.active || prize.stock <= 0) {
    return {
      success: false as const,
      error: "Prêmio indisponível.",
    }
  }

  return {
    success: true as const,
    prize,
  }
}