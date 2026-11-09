"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma"

import { GAME_CONFIG } from "@/lib/game/config"

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
        // ==========================================
        // 1. VERIFICAR PARTIDA EM ANDAMENTO
        // ==========================================

        const running = await tx.gameAttempt.findFirst({
          where: {
            userId,
            status: "RUNNING",
          },
          select: {
            id: true,
          },
        })

        if (running) {
          throw new Error("ACTIVE_GAME")
        }

        // ==========================================
        // 2. BUSCAR PRÊMIO
        // ==========================================

        const prize = await tx.prize.findUnique({
          where: {
            id: prizeId,
          },
          select: {
            id: true,
            name: true,
            active: true,
            stock: true,
            playCost: true,
            targetMs: true,
            speedFactor: true,
          },
        })

        if (!prize || !prize.active || prize.stock <= 0) {
          throw new Error("PRIZE_UNAVAILABLE")
        }

        if (
          !Number.isSafeInteger(prize.playCost) ||
          prize.playCost <= 0 ||
          prize.targetMs <= 0 ||
          prize.speedFactor <= 0
        ) {
          throw new Error("INVALID_CONFIG")
        }

        // ==========================================
        // 3. DESCONTAR DA CARTEIRA DO SITE
        // ==========================================
        //
        // Wallet.balance = créditos fictícios
        //
        // Não altera:
        // PaymentAccount.availableBalance
        // PaymentAccount.reservedBalance
        //
        // O desconto ocorre apenas se houver
        // saldo suficiente.
        // ==========================================

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

        // ==========================================
        // 4. CONSULTAR SALDO ATUALIZADO
        // ==========================================

        const wallet = await tx.wallet.findUniqueOrThrow({
          where: {
            userId,
          },
          select: {
            balance: true,
          },
        })

        // ==========================================
        // 5. CRIAR TENTATIVA
        // ==========================================

        const attempt = await tx.gameAttempt.create({
          data: {
            userId,
            prizeId: prize.id,
            status: "RUNNING",
            targetMs: prize.targetMs,
            speedFactor: prize.speedFactor,
            playCost: prize.playCost,
          },
          select: {
            id: true,
            startedAt: true,
            targetMs: true,
            speedFactor: true,
            playCost: true,
          },
        })

        // ==========================================
        // 6. REGISTRAR TRANSAÇÃO DA CARTEIRA
        // ==========================================

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

        // ==========================================
        // 7. RETORNAR DADOS PARA O FRONTEND
        // ==========================================

        return {
          attemptId: attempt.id,
          startedAt: attempt.startedAt.toISOString(),
          targetMs: attempt.targetMs,
          speedFactor: attempt.speedFactor,
          playCost: attempt.playCost,
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
      serverNow: new Date().toISOString(),
      multiplier: GAME_CONFIG.multiplier,
      toleranceMs: GAME_CONFIG.toleranceMs,
    }
  } catch (error) {
    // ==========================================
    // CONFLITO ENTRE TRANSAÇÕES
    // ==========================================

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        success: false as const,
        error: "Conflito ao iniciar. Tente novamente.",
        code: "CONFLICT",
      }
    }

    // ==========================================
    // ERROS CONHECIDOS
    // ==========================================

    const messages: Record<string, string> = {
      ACTIVE_GAME:
        "Você já possui uma tentativa em andamento.",

      PRIZE_UNAVAILABLE:
        "Desafio indisponível.",

      INVALID_CONFIG:
        "Configuração inválida.",

      INSUFFICIENT_BALANCE:
        "Saldo de créditos insuficiente.",
    }

    if (
      error instanceof Error &&
      messages[error.message]
    ) {
      return {
        success: false as const,
        error: messages[error.message],
        code: error.message,
      }
    }

    console.error("[START_GAME]", error)

    return {
      success: false as const,
      error: "Não foi possível iniciar o desafio.",
      code: "INTERNAL_ERROR",
    }
  }
}