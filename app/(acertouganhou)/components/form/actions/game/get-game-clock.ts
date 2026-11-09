"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function getGameClock(attemptId: string) {
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

  const attempt = await prisma.gameAttempt.findFirst({
    where: {
      id: attemptId,
      userId: session.user.id,
    },
    select: {
      status: true,
      startedAt: true,
      stoppedAt: true,
      elapsedMs: true,
      targetMs: true,
      speedFactor: true,
    },
  })

  if (!attempt) {
    return {
      success: false as const,
      error: "Tentativa não encontrada.",
    }
  }

  const serverNow = Date.now()

  const realElapsedMs =
    attempt.status === "RUNNING"
      ? Math.max(
          0,
          serverNow - attempt.startedAt.getTime()
        )
      : Math.max(
          0,
          (attempt.stoppedAt?.getTime() ?? serverNow) -
            attempt.startedAt.getTime()
        )

  const elapsedMs =
    attempt.status === "RUNNING"
      ? Math.round(
          (realElapsedMs * attempt.speedFactor) / 1000
        )
      : (attempt.elapsedMs ??
          Math.round(
            (realElapsedMs * attempt.speedFactor) / 1000
          ))

  return {
    success: true as const,
    status: attempt.status,
    elapsedMs,
    targetMs: attempt.targetMs,
    serverNow,
  }
}