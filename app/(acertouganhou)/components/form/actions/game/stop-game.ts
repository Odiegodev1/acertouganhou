"use server"

import { auth } from "@/lib/auth"
import  prisma from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma"

export async function stopGame(attemptId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Não autenticado.",
    }
  }

  const userId = session.user.id

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const attempt = await tx.gameAttempt.findFirst({
          where: {
            id: attemptId,
            userId,
            status: "RUNNING",
          },
        })

        if (!attempt) {
          throw new Error("INVALID_ATTEMPT")
        }

        const stoppedAt = new Date()

        const realElapsedMs = Math.max(
          0,
          stoppedAt.getTime() - attempt.startedAt.getTime()
        )

        // O cronômetro visual pode usar velocidade configurada.
        const elapsedMs = Math.floor(
          (realElapsedMs * attempt.speedFactor) / 1000
        )

        // Sem tolerância ou função "ganhou".
        const won = elapsedMs === attempt.targetMs

        const updated = await tx.gameAttempt.updateMany({
          where: {
            id: attempt.id,
            userId,
            status: "RUNNING",
          },
          data: {
            status: won ? "WON" : "LOST",
            stoppedAt,
            elapsedMs,
          },
        })

        if (updated.count !== 1) {
          throw new Error("ALREADY_FINISHED")
        }

        let balance: number | null = null

        if (won) {
          // Prêmio fictício: registra conquista e credita
          // o valor demonstrativo na carteira.
          const prize = await tx.prize.updateMany({
            where: {
              id: attempt.prizeId,
              stock: { gt: 0 },
              active: true,
            },
            data: {
              stock: { decrement: 1 },
            },
          })

          if (prize.count !== 1) {
            throw new Error("PRIZE_UNAVAILABLE")
          }

          const prizeData = await tx.prize.findUniqueOrThrow({
            where: { id: attempt.prizeId },
          })

          await tx.prizeClaim.create({
            data: {
              userId,
              prizeId: attempt.prizeId,
              attemptId: attempt.id,
              status: "PENDING",
              value: prizeData.value,
            },
          })

          const wallet = await tx.wallet.update({
            where: { userId },
            data: {
              balance: {
                increment: prizeData.value,
              },
            },
          })

          balance = wallet.balance

          await tx.walletTransaction.create({
            data: {
              userId,
              type: "GAME_PRIZE",
              amount: prizeData.value,
              balanceAfter: wallet.balance,
              description: `Prêmio fictício: ${prizeData.name}`,
              referenceId: `game-prize:${attempt.id}`,
            },
          })
        }

        return {
          status: won ? ("WON" as const) : ("LOST" as const),
          elapsedMs,
          targetMs: attempt.targetMs,
          balance,
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    )

    return {
      success: true as const,
      ...result,
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        success: false as const,
        error: "Conflito ao encerrar. Tente novamente.",
      }
    }

    return {
      success: false as const,
      error: "Não foi possível encerrar a tentativa.",
    }
  }
}