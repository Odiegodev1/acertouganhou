"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma"

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
    !attemptId ||
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

        const serverElapsedMs = Math.max(
          0,
          receivedAt.getTime() -
            attempt.startedAt.getTime()
        )

        const elapsedMs = Math.round(clientElapsedMs)

        const maximumElapsedMs =
          Math.floor(
            (serverElapsedMs * attempt.speedFactor) / 1000
          ) + 250

        if (elapsedMs > maximumElapsedMs) {
          throw new Error("INVALID_TIME")
        }

        const updated = await tx.gameAttempt.updateMany({
          where: {
            id: attempt.id,
            userId,
            status: "RUNNING",
          },
          data: {
            status: "LOST",
            stoppedAt: receivedAt,
            elapsedMs,
          },
        })

        if (updated.count !== 1) {
          throw new Error("ALREADY_FINISHED")
        }

        return {
          status: "LOST" as const,
          elapsedMs,
          targetMs: attempt.targetMs,
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

    if (
      error instanceof Error &&
      error.message === "INVALID_TIME"
    ) {
      return {
        success: false as const,
        error: "Tempo informado incompatível com a tentativa.",
      }
    }

    return {
      success: false as const,
      error: "Não foi possível encerrar a tentativa.",
    }
  }
}