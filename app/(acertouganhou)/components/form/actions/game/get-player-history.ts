"use server"

import { auth } from "@/lib/auth"
import  prisma  from "@/lib/prisma"

export async function getPlayerHistory() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Você precisa estar logado.",
    }
  }

  const userId = session.user.id

  const [attempts, claims] = await Promise.all([
    prisma.gameAttempt.findMany({
      where: {
        userId,
      },
      include: {
        prize: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    }),

    prisma.prizeClaim.findMany({
      where: {
        userId,
      },
      include: {
        prize: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ])

  return {
    success: true as const,

    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      prizeId: attempt.prizeId,
      prizeName: attempt.prize.name,
      playCost: attempt.prize.playCost,
      targetMs: attempt.prize.targetMs,
      elapsedMs: attempt.elapsedMs,
      status: attempt.status,
      createdAt: attempt.createdAt.toISOString(),
    })),

    claims: claims.map((claim) => ({
      id: claim.id,
      prizeId: claim.prizeId,
      prizeName: claim.prize.name,
      createdAt: claim.createdAt.toISOString(),
    })),
  }
}