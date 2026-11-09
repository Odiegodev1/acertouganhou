"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

import { GAME_CONFIG } from "@/lib/game/config"

export async function createLatencyProbe(attemptId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Não autenticado.",
    }
  }

  const attempt = await prisma.gameAttempt.findFirst({
    where: {
      id: attemptId,
      userId: session.user.id,
      status: "RUNNING",
    },
    select: {
      id: true,
    },
  })

  if (!attempt) {
    return {
      success: false as const,
      error: "Tentativa não encontrada.",
    }
  }

  const probe = await prisma.gameLatencySample.create({
    data: {
      attemptId,
      userId: session.user.id,
      roundTripMs: -1,
    },
  })

  return {
    success: true as const,
    probeId: probe.id,
  }
}

export async function finishLatencyProbe(
  attemptId: string,
  probeId: string
) {
  const receivedAt = new Date()

  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Não autenticado.",
    }
  }

  const probe = await prisma.gameLatencySample.findFirst({
    where: {
      id: probeId,
      attemptId,
      userId: session.user.id,
      roundTripMs: -1,
    },
  })

  if (!probe) {
    return {
      success: false as const,
      error: "Medição inválida.",
    }
  }

  const roundTripMs = Math.max(
    0,
    receivedAt.getTime() - probe.createdAt.getTime()
  )

  if (roundTripMs > GAME_CONFIG.maxAcceptedRttMs) {
    await prisma.gameLatencySample.delete({
      where: { id: probe.id },
    })

    return {
      success: false as const,
      error: "Medição descartada.",
    }
  }

  await prisma.gameLatencySample.updateMany({
    where: {
      id: probe.id,
      roundTripMs: -1,
    },
    data: {
      roundTripMs,
    },
  })

  return {
    success: true as const,
    roundTripMs,
  }
}