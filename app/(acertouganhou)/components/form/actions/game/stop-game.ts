"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma"

import { GAME_CONFIG } from "@/lib/game/config"
import { calculateLatencyCompensation } from "@/lib/game/latency-probe"


export async function stopGame(attemptId: string) {
  // Registra o recebimento antes da autenticação.
  const receivedAt = new Date()

  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Não autenticado.",
    }
  }

  if (!attemptId?.trim()) {
    return {
      success: false as const,
      error: "Tentativa inválida.",
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
          },
        })

        if (!attempt) {
          throw new Error("INVALID_ATTEMPT")
        }

        // Idempotência: nunca recalcula uma tentativa finalizada.
        if (
          attempt.status === "WON" ||
          attempt.status === "LOST"
        ) {
          return {
            status: attempt.status,
            elapsedMs: attempt.elapsedMs ?? 0,
            targetMs: attempt.targetMs,
            multiplier: GAME_CONFIG.multiplier,
            toleranceMs: GAME_CONFIG.toleranceMs,
            balance: null,
          }
        }

        if (attempt.status !== "RUNNING") {
          throw new Error("INVALID_ATTEMPT")
        }

        // Busca medições válidas desta tentativa.
        const samples = await tx.gameLatencySample.findMany({
          where: {
            attemptId: attempt.id,
            userId,
            roundTripMs: {
              gte: 0,
              lte: GAME_CONFIG.maxAcceptedRttMs,
            },
          },
          select: {
            roundTripMs: true,
          },
          orderBy: {
            roundTripMs: "asc",
          },
          take: GAME_CONFIG.maxLatencySamples,
        })

        const latencyCompensationMs =
          calculateLatencyCompensation(
            samples.map((sample) => sample.roundTripMs)
          )

        // Tempo real no servidor.
        const rawRealElapsedMs = Math.max(
          0,
          receivedAt.getTime() -
            attempt.startedAt.getTime()
        )

        // Compensação aplicada em milissegundos reais.
        const adjustedRealElapsedMs = Math.max(
          0,
          rawRealElapsedMs - latencyCompensationMs
        )

        // Converte para o tempo do jogo.
        const elapsedMs = Math.round(
          (adjustedRealElapsedMs *
            attempt.speedFactor) /
            1000
        )

        const differenceMs = Math.abs(
          elapsedMs - attempt.targetMs
        )

        const won =
          rawRealElapsedMs <=
            GAME_CONFIG.maxDurationMs +
              latencyCompensationMs &&
          differenceMs <= GAME_CONFIG.toleranceMs

        const status = won
          ? ("WON" as const)
          : ("LOST" as const)

        // Atualização condicional.
        const updated = await tx.gameAttempt.updateMany({
          where: {
            id: attempt.id,
            userId,
            status: "RUNNING",
          },
          data: {
            status,
            stoppedAt: receivedAt,
            elapsedMs,
          },
        })

        if (updated.count !== 1) {
          throw new Error("ALREADY_FINISHED")
        }

        return {
          status,
          elapsedMs,
          targetMs: attempt.targetMs,
          multiplier: GAME_CONFIG.multiplier,
          toleranceMs: GAME_CONFIG.toleranceMs,
          latencyCompensationMs,
          rawElapsedMs: Math.round(
            (rawRealElapsedMs *
              attempt.speedFactor) /
              1000
          ),
          balance: null,
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
        error:
          "Conflito ao finalizar. Consulte novamente.",
      }
    }

    console.error("[STOP_GAME]", error)

    return {
      success: false as const,
      error:
        "Não foi possível confirmar o resultado.",
    }
  }
}