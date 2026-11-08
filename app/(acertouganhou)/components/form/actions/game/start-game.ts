"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma"

export async function startGame(prizeId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Faça login para jogar.",
      code: "UNAUTHORIZED",
    }
  }

  if (!prizeId?.trim()) {
    return {
      success: false as const,
      error: "Prêmio inválido.",
      code: "INVALID_PRIZE",
    }
  }

  const userId = session.user.id

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const running = await tx.gameAttempt.findFirst({
          where: {
            userId,
            status: "RUNNING",
          },
        })

        if (running) {
          throw new Error("ACTIVE_GAME")
        }

        const prize = await tx.prize.findUnique({
          where: {
            id: prizeId,
          },
        })

        if (!prize || !prize.active || prize.stock <= 0) {
          throw new Error("PRIZE_UNAVAILABLE")
        }

        if (
          prize.playCost <= 0 ||
          prize.targetMs <= 0 ||
          prize.speedFactor <= 0
        ) {
          throw new Error("INVALID_CONFIG")
        }

        const debit = await tx.wallet.updateMany({
          where: {
            userId,
            balance: {
              gte: prize.playCost,
            },
          },
          data: {
            balance: {
              decrement: prize.playCost,
            },
          },
        })

        if (debit.count !== 1) {
          throw new Error("INSUFFICIENT_BALANCE")
        }

        const wallet = await tx.wallet.findUniqueOrThrow({
          where: { userId },
        })

        const attempt = await tx.gameAttempt.create({
          data: {
            userId,
            prizeId,
            status: "RUNNING",
            targetMs: prize.targetMs,
            speedFactor: prize.speedFactor,
            playCost: prize.playCost,
          },
        })

        await tx.walletTransaction.create({
          data: {
            userId,
            type: "GAME_DEBIT",
            amount: -prize.playCost,
            balanceAfter: wallet.balance,
            description: `Tentativa: ${prize.name}`,
            referenceId: `game-debit:${attempt.id}`,
          },
        })

        return {
          attemptId: attempt.id,
          startedAt: attempt.startedAt.toISOString(),
          targetMs: attempt.targetMs,
          speedFactor: attempt.speedFactor,
          balance: wallet.balance,
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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        success: false as const,
        error: "Outra operação está em andamento. Tente novamente.",
        code: "CONFLICT",
      }
    }

    if (error instanceof Error) {
      const errors: Record<string, string> = {
        INSUFFICIENT_BALANCE: "Saldo fictício insuficiente.",
        ACTIVE_GAME: "Você já possui uma tentativa em andamento.",
        PRIZE_UNAVAILABLE: "Prêmio indisponível.",
        INVALID_CONFIG: "Configuração do prêmio inválida.",
      }

      if (errors[error.message]) {
        return {
          success: false as const,
          error: errors[error.message],
          code: error.message,
        }
      }
    }

    console.error("Erro ao iniciar jogo:", error)

    return {
      success: false as const,
      error: "Não foi possível iniciar o jogo.",
      code: "INTERNAL_ERROR",
    }
  }
}