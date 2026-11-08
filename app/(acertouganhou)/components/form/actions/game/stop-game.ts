"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma"

import { checkMultiplier } from "@/lib/game/multiplier"

export async function stopGame(
  attemptId: string,
  clientElapsedMs: number
) {
  const receivedAt = new Date()

  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Não autenticado.",
    }
  }

  if (
    !attemptId?.trim() ||
    !Number.isFinite(clientElapsedMs) ||
    clientElapsedMs < 0 ||
    clientElapsedMs > 300_000
  ) {
    return {
      success: false as const,
      error: "Dados da tentativa inválidos.",
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

        // Tempo real medido pelo servidor
        const serverElapsedMs = Math.max(
          0,
          receivedAt.getTime() -
            attempt.startedAt.getTime()
        )

        // Aplica o fator de velocidade do desafio
        const elapsedMs = Math.round(
          (serverElapsedMs * attempt.speedFactor) / 1000
        )

        // Tempo que o navegador informou
        const reportedElapsedMs = Math.round(
          clientElapsedMs
        )

        // Diferença entre o cliente e o servidor
        const clientDifferenceMs = Math.abs(
          reportedElapsedMs - elapsedMs
        )

        // Tolerância de sincronização.
        // É diferente da margem para ganhar.
        const SYNC_TOLERANCE_MS = 500

        if (clientDifferenceMs > SYNC_TOLERANCE_MS) {
          throw new Error("INVALID_TIME")
        }

        // Verifica a regra do modo multiplicador
        const gameResult = checkMultiplier({
          targetMs: attempt.targetMs,
          elapsedMs,
        })

        // Finaliza uma única vez
        const updated = await tx.gameAttempt.updateMany({
          where: {
            id: attempt.id,
            userId,
            status: "RUNNING",
          },
          data: {
            status: gameResult.status,
            stoppedAt: receivedAt,
            elapsedMs,
          },
        })

        if (updated.count !== 1) {
          throw new Error("ALREADY_FINISHED")
        }

        return {
          status: gameResult.status,
          elapsedMs,
          targetMs: attempt.targetMs,
          differenceMs: gameResult.differenceMs,
          toleranceMs: gameResult.toleranceMs,
          multiplier: gameResult.multiplier,

          // Nenhum crédito é concedido nesta etapa.
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
        error: "Conflito ao encerrar. Tente novamente.",
      }
    }

    if (error instanceof Error) {
      if (error.message === "INVALID_TIME") {
        return {
          success: false as const,
          error:
            "Tempo informado incompatível com a tentativa.",
        }
      }

      if (
        error.message === "INVALID_ATTEMPT" ||
        error.message === "ALREADY_FINISHED"
      ) {
        return {
          success: false as const,
          error:
            "Tentativa inválida ou já finalizada.",
        }
      }
    }

    console.error("Erro ao encerrar jogo:", error)

    return {
      success: false as const,
      error: "Não foi possível encerrar a tentativa.",
    }
  }
}