import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  )
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    // ==========================================
    // 1. AUTENTICAÇÃO
    // ==========================================

    const session = await auth()

    if (!session?.user?.id) {
      return jsonError("Não autorizado.", 401)
    }

    // ==========================================
    // 2. IDENTIFICADOR DO DEPÓSITO
    // ==========================================

    const { id } = await context.params

    if (!id || typeof id !== "string") {
      return jsonError("Identificador inválido.", 400)
    }

    // ==========================================
    // 3. CONSULTAR DEPÓSITO
    // ==========================================

    const deposit = await prisma.paymentDeposit.findFirst({
      where: {
        id,
        userId: session.user.id,
      },

      select: {
        id: true,
        amount: true,
        status: true,
        creditedAt: true,
        expiresAt: true,
      },
    })

    if (!deposit) {
      return jsonError("Depósito não encontrado.", 404)
    }

    // ==========================================
    // 4. VERIFICAR CRÉDITO
    // ==========================================

    const credited = deposit.creditedAt !== null

    // ==========================================
    // 5. RESPOSTA
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        deposit: {
          id: deposit.id,
          amount: deposit.amount,
          status: deposit.status,
          credited,
          expiresAt:
            deposit.expiresAt?.toISOString() ?? null,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    )
  } catch (error) {
    console.error("[GET_DEPOSIT_STATUS]", error)

    return jsonError(
      "Não foi possível consultar o depósito.",
      500
    )
  }
}