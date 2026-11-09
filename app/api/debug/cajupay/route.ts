import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"



export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Indisponível" },
      { status: 404 }
    )
  }

  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    )
  }

  const apiKey = process.env.CAJUPAY_API_KEY
  const apiSecret = process.env.CAJUPAY_API_SECRET

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Credenciais ausentes" },
      { status: 503 }
    )
  }

  try {
    const response = await fetch(
      "https://api.cajupay.com.br/api/payments",
      {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "X-API-Secret": apiSecret,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    )

    const raw = await response.text()

    console.info("[CAJUPAY_AUTH_TEST]", {
      status: response.status,
      ok: response.ok,
      contentType:
        response.headers.get("content-type"),
      bodyLength: raw.length,
    })

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      contentType:
        response.headers.get("content-type"),
      message: response.ok
        ? "Consulta realizada com sucesso."
        : "A CajuPay recusou a consulta.",
    })
  } catch (error) {
    console.error("[CAJUPAY_AUTH_TEST_ERROR]", {
      name:
        error instanceof Error
          ? error.name
          : "UnknownError",
    })

    return NextResponse.json(
      {
        success: false,
        error: "Falha na comunicação com a CajuPay.",
      },
      { status: 502 }
    )
  }
}