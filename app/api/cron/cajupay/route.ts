import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"

import { reconcileCajuPayDeposits } from "@/lib/payments/reconcile-cajupay"

// ==========================================
// AUTENTICAÇÃO DO CRON
// ==========================================

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET

  if (!secret || secret.length < 32) {
    return false
  }

  const authorization =
    request.headers.get("authorization")

  if (!authorization?.startsWith("Bearer ")) {
    return false
  }

  const suppliedToken = authorization.slice(
    "Bearer ".length
  )

  if (!suppliedToken) {
    return false
  }

  const supplied = Buffer.from(suppliedToken, "utf8")
  const expected = Buffer.from(secret, "utf8")

  if (supplied.length !== expected.length) {
    return false
  }

  return timingSafeEqual(supplied, expected)
}

// ==========================================
// EXECUTAR RECONCILIAÇÃO
// ==========================================

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Não autorizado.",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }

  if (process.env.PAYMENTS_ENABLED !== "true") {
    return NextResponse.json(
      {
        success: false,
        error: "Pagamentos desabilitados.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }

  try {
    // ==========================================
    // 1. INICIAR RECONCILIAÇÃO
    // ==========================================

    console.info("[CAJUPAY_CRON_START]", {
      timestamp: new Date().toISOString(),
    })

    // ==========================================
    // 2. EXECUTAR
    // ==========================================

    const result = await reconcileCajuPayDeposits()

    // ==========================================
    // 3. FINALIZAR
    // ==========================================

    console.info("[CAJUPAY_CRON_SUCCESS]", {
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (error) {
    console.error("[CAJUPAY_CRON_ERROR]", error)

    return NextResponse.json(
      {
        success: false,
        error: "Falha na reconciliação.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }
}