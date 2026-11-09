import "server-only"

import { z } from "zod"

// ======================================================
// TIPOS
// ======================================================

type HttpMethod = "GET" | "POST"

type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "EVP"

type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "CHARGEBACK"

type TransactionType = "CASH_IN" | "CASH_OUT"

export interface SkalaPayTransaction {
  id: string | number
  order_id?: string
  external_id?: string
  type?: TransactionType
  status: TransactionStatus
  amount?: number
  net_amount?: number
  fee?: number
  paid_at?: string | null
  created_at?: string
}

export interface SkalaPayAcquirerResponse {
  qr_code?: string
  qr_code_base64?: string
  expires_at?: string
}

export interface SkalaPayResponse {
  transaction?: SkalaPayTransaction
  acquirer_response?: SkalaPayAcquirerResponse
  message?: string
  error?: string
}

export interface CreateCashInInput {
  amountCents: number
  description?: string

  customer: {
    name: string
    email: string
    document: string
    phone: string
  }

  postbackUrl: string

  metadata?: Record<string, string | number | boolean>
}

export interface CreateCashOutInput {
  amountCents: number
  pixKey: string
  pixKeyType: PixKeyType
  description?: string
  postbackUrl: string
}

// ======================================================
// ERROS
// ======================================================


export class SkalaPayError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string
  ) {
    super(message)

    this.name = "SkalaPayError"
  }
}

// ======================================================
// VALIDAÇÕES
// ======================================================

const amountSchema = z
  .number()
  .int()
  .min(1000)
  .max(1000000)

const cashInSchema = z.object({
  amountCents: amountSchema,

  description: z.string().max(255).optional(),

  customer: z.object({
    name: z.string().trim().min(3),
    email: z.email(),
    document: z.string().trim().min(11),
    phone: z.string().trim().min(10),
  }),

  postbackUrl: z.url(),

  metadata: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean()])
    )
    .optional(),
})

const cashOutSchema = z.object({
  amountCents: amountSchema,

  pixKey: z.string().trim().min(1),

  pixKeyType: z.enum([
    "CPF",
    "CNPJ",
    "EMAIL",
    "EVP",
  ]),

  description: z.string().max(255).optional(),

  postbackUrl: z.url(),
})

// ======================================================
// CONFIGURAÇÕES
// ======================================================

const REQUEST_TIMEOUT_MS = 15000

function getBaseUrl() {
  const raw = process.env.SKALAPAY_BASE_URL?.trim()

  if (!raw) {
    throw new SkalaPayError(
      "SKALAPAY_BASE_URL não configurada.",
      503,
      "MISSING_BASE_URL"
    )
  }

  let url: URL

  try {
    url = new URL(raw)
  } catch {
    throw new SkalaPayError(
      "SKALAPAY_BASE_URL inválida. Informe uma URL HTTPS, sem formatação Markdown.",
      503,
      "INVALID_BASE_URL"
    )
  }

  if (url.protocol !== "https:") {
    throw new SkalaPayError(
      "A URL da API precisa utilizar HTTPS.",
      503,
      "INSECURE_BASE_URL"
    )
  }

  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new SkalaPayError(
      "A URL da API contém parâmetros não permitidos.",
      503,
      "INVALID_BASE_URL"
    )
  }

  return url.toString().replace(/\/+$/, "")
}

function getCredentials() {
    const clientId = process.env.SKALAPAY_CLIENT_ID?.trim()
    const clientSecret = process.env.SKALAPAY_CLIENT_SECRET?.trim()
  
    if (!clientId || !clientSecret) {
      throw new SkalaPayError(
        "Credenciais da SkalaPay não configuradas.",
        503,
        "MISSING_CREDENTIALS"
      )
    }
  
    return { clientId, clientSecret }
  }

  function assertPaymentsEnabled() {
    if (process.env.PAYMENTS_ENABLED !== "true") {
      throw new SkalaPayError(
        "Operações financeiras desabilitadas.",
        503,
        "PAYMENTS_DISABLED"
      )
    }
  
    if (
      process.env.PAYMENTS_ENV !== "production" ||
      process.env.SKALAPAY_PRODUCTION_CONFIRMED !== "true"
    ) {
      throw new SkalaPayError(
        "A integração de produção não está habilitada.",
        503,
        "PRODUCTION_NOT_CONFIRMED"
      )
    }
  }

function centsToReais(amountCents: number) {
  if (
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0
  ) {
    throw new SkalaPayError(
      "Valor monetário inválido.",
      422,
      "INVALID_AMOUNT"
    )
  }

  return Number((amountCents / 100).toFixed(2))
}

// ======================================================
// RESPOSTAS DO PROVEDOR
// ======================================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  )
}

function getProviderErrorCode(data: unknown) {
  if (!isRecord(data)) {
    return null
  }

  const code = data.code

  if (typeof code === "string") {
    return code.slice(0, 100)
  }

  if (typeof code === "number") {
    return String(code)
  }

  return null
}

function getHttpErrorMessage(status: number) {
  const messages: Record<number, string> = {
    400: "A API rejeitou os parâmetros da requisição.",

    401:
      "A API recusou a autenticação. Verifique o ambiente, as credenciais e o método de autenticação exigido pela SkalaPay.",

    403:
      "Acesso negado pelo provedor. Verifique as permissões e possíveis restrições de IP.",

    404:
      "Endpoint ou transação não encontrada.",

    409:
      "Conflito ao processar a transação.",

    422:
      "Dados da transação rejeitados pelo provedor.",

    429:
      "Limite de requisições atingido.",

    500:
      "Erro interno do provedor.",

    502:
      "Falha temporária no gateway.",

    503:
      "Serviço do provedor indisponível.",
  }

  return (
    messages[status] ??
    `O provedor retornou HTTP ${status}.`
  )
}

function normalizeStatus(
  status: string
): TransactionStatus {
  const normalized = status.toUpperCase()

  switch (normalized) {
    case "PENDING":
    case "PROCESSING":
    case "PAID":
    case "FAILED":
    case "CANCELLED":
    case "REFUNDED":
    case "CHARGEBACK":
      return normalized

    default:
      throw new SkalaPayError(
        `Status de transação desconhecido: ${status}`,
        502,
        "UNKNOWN_TRANSACTION_STATUS"
      )
  }
}

// ======================================================
// CLIENTE HTTP
// ======================================================

async function skalapayRequest<T>(
  method: HttpMethod,
  endpoint: string,
  body?: unknown
): Promise<T> {
  assertPaymentsEnabled()

  const baseUrl = getBaseUrl()
  const { clientId, clientSecret } = getCredentials()

  const controller = new AbortController()

  const timeout = setTimeout(() => {
    controller.abort()
  }, REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(
      `${baseUrl}${endpoint}`,
      {
        method,

        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Client-Id": clientId,
            "X-Client-Secret": clientSecret,
          },

        body:
          body === undefined
            ? undefined
            : JSON.stringify(body),

        signal: controller.signal,

        cache: "no-store",

        redirect: "error",
      }
    )

    const raw = await response.text()

    let data: unknown = null

    if (raw) {
      try {
        data = JSON.parse(raw)
      } catch {
        if (response.ok) {
          throw new SkalaPayError(
            "O provedor retornou uma resposta JSON inválida.",
            502,
            "INVALID_JSON_RESPONSE"
          )
        }
      }
    }

    // --------------------------------------------------
    // DIAGNÓSTICO SEGURO
    // --------------------------------------------------

    if (!response.ok) {
      const providerCode =
        getProviderErrorCode(data)

      console.error("[SKALAPAY_HTTP_ERROR]", {
        method,
        endpoint,
        status: response.status,
        statusText: response.statusText,
        providerCode,
        environment: process.env.PAYMENTS_ENV,
      })

      throw new SkalaPayError(
        getHttpErrorMessage(response.status),
        response.status,
        providerCode ?? "PROVIDER_ERROR"
      )
    }

    if (!isRecord(data)) {
      throw new SkalaPayError(
        "O provedor retornou uma resposta inesperada.",
        502,
        "INVALID_RESPONSE"
      )
    }

    return data as T
  } catch (error) {
    if (error instanceof SkalaPayError) {
      throw error
    }

    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new SkalaPayError(
        "Tempo limite de comunicação com a SkalaPay.",
        504,
        "TIMEOUT"
      )
    }

    console.error("[SKALAPAY_NETWORK_ERROR]", {
      method,
      endpoint,
      errorType:
        error instanceof Error
          ? error.name
          : "UnknownError",
    })

    throw new SkalaPayError(
      "Falha de comunicação com o provedor.",
      502,
      "NETWORK_ERROR"
    )
  } finally {
    clearTimeout(timeout)
  }
}

// ======================================================
// DEPÓSITO PIX
// ======================================================

export async function createSkalaPayCashIn(
  input: CreateCashInInput
): Promise<SkalaPayResponse> {
  assertPaymentsEnabled()

  const parsed = cashInSchema.parse(input)

  // O formato abaixo segue seu cliente anterior.
  // Confirme os nomes dos campos na documentação.
  const response =
    await skalapayRequest<SkalaPayResponse>(
      "POST",
      "/cash-in",
      {
        amount: centsToReais(parsed.amountCents),

        payment_method: "pix",

        description:
          parsed.description ?? "Depósito via Pix",

        customer_data: {
          name: parsed.customer.name,
          email: parsed.customer.email,
          document: parsed.customer.document,
          phone: parsed.customer.phone,
        },

        postback_url: parsed.postbackUrl,

        metadata: parsed.metadata ?? {},
      }
    )

  if (
    response.transaction?.id === undefined ||
    response.transaction.id === null
  ) {
    throw new SkalaPayError(
      "O provedor não retornou o identificador da cobrança.",
      502,
      "MISSING_TRANSACTION_ID"
    )
  }

  return response
}

// ======================================================
// CONSULTAR DEPÓSITO
// ======================================================

export async function getSkalaPayCashIn(
  transactionId: string | number
): Promise<SkalaPayResponse> {
  assertPaymentsEnabled()

  const response =
    await skalapayRequest<SkalaPayResponse>(
      "GET",
      `/cash-in/${encodeURIComponent(
        String(transactionId)
      )}`
    )

  if (response.transaction?.status) {
    response.transaction.status = normalizeStatus(
      response.transaction.status
    )
  }

  return response
}

// ======================================================
// SAQUE PIX
// ======================================================

export async function createSkalaPayCashOut(
  input: CreateCashOutInput
): Promise<SkalaPayResponse> {
  assertPaymentsEnabled()

  const parsed = cashOutSchema.parse(input)

  // Confirmar contrato oficial antes de habilitar saques.
  const response =
    await skalapayRequest<SkalaPayResponse>(
      "POST",
      "/cash-out",
      {
        amount: centsToReais(parsed.amountCents),

        payment_method: "pix",

        pix_key: parsed.pixKey,

        pix_key_type: parsed.pixKeyType,

        description:
          parsed.description ?? "Saque via Pix",

        postback_url: parsed.postbackUrl,
      }
    )

  if (
    response.transaction?.id === undefined ||
    response.transaction.id === null
  ) {
    throw new SkalaPayError(
      "O provedor não retornou o identificador do saque.",
      502,
      "MISSING_TRANSACTION_ID"
    )
  }

  return response
}

// ======================================================
// CONSULTAR SAQUE
// ======================================================

export async function getSkalaPayCashOut(
  transactionId: string | number
): Promise<SkalaPayResponse> {
  assertPaymentsEnabled()

  const response =
    await skalapayRequest<SkalaPayResponse>(
      "GET",
      `/cash-out/${encodeURIComponent(
        String(transactionId)
      )}`
    )

  if (response.transaction?.status) {
    response.transaction.status = normalizeStatus(
      response.transaction.status
    )
  }

  return response
}

// ======================================================
// STATUS DA CONFIGURAÇÃO
// ======================================================

export function getSkalaPayConfigStatus() {
  const clientId =
    process.env.SKALAPAY_CLIENT_ID?.trim()

  const clientSecret =
    process.env.SKALAPAY_CLIENT_SECRET?.trim()

  const baseUrl =
    process.env.SKALAPAY_BASE_URL?.trim()

  return {
    provider: "SKALAPAY" as const,

    enabled:
      process.env.PAYMENTS_ENABLED === "true",

    environment:
      process.env.PAYMENTS_ENV ?? "not-configured",

    credentialsConfigured: Boolean(
      clientId && clientSecret
    ),

    baseUrlConfigured: Boolean(baseUrl),
  }
}