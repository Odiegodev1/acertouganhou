"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma"

import { GAME_CONFIG } from "@/lib/game/config"

export async function expireGame(attemptId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Não autenticado.",
    }
  }

  const now = new Date()

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const attempt = await tx.gameAttempt.findFirst({
          where: {
            id: attemptId,
            userId: session?.user?.id,
          },
        })

        if (!attempt) {
          throw new Error("INVALID_ATTEMPT")
        }

        if (attempt.status !== "RUNNING") {
          return {
            status: attempt.status,
            elapsedMs: attempt.elapsedMs ?? 0,
            targetMs: attempt.targetMs,
          }
        }

        const realElapsedMs = Math.max(
          0,
          now.getTime() - attempt.startedAt.getTime()
        )

        const elapsedMs = Math.round(
          (realElapsedMs * attempt.speedFactor) / 1000
        )

        const maxAllowedMs =
          attempt.targetMs + GAME_CONFIG.toleranceMs

        if (elapsedMs <= maxAllowedMs) {
          return {
            status: "RUNNING" as const,
            elapsedMs,
            targetMs: attempt.targetMs,
          }
        }

        const updated = await tx.gameAttempt.updateMany({
          where: {
            id: attempt.id,
            userId: session?.user?.id,
            status: "RUNNING",
          },
          data: {
            status: "LOST",
            elapsedMs,
            stoppedAt: now,
          },
        })

        if (updated.count !== 1) {
          throw new Error("CONFLICT")
        }

        return {
          status: "LOST" as const,
          elapsedMs,
          targetMs: attempt.targetMs,
        }
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    )

    return {
      success: true as const,
      ...result,
    }
  } catch (error) {
    console.error("[EXPIRE_GAME]", error)

    return {
      success: false as const,
      error: "Não foi possível verificar o desafio.",
    }
  }
}