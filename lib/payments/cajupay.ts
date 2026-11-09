import "server-only"

import { randomUUID } from "node:crypto"

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const DEFAULT_API_URL = "https://api.cajupay.com.br"

const DEFAULT_PIX_PATH = "/api/payments/pix"

const REQUEST_TIMEOUT = 15000

const DEBUG_ENABLED =
  process.env.CAJUPAY_DEBUG === "true" ||
  process.env.NODE_ENV === "development"

// ==========================================
// TIPOS
// ==========================================

export class CajuPayError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string = "CAJUPAY_ERROR"
  ) {
    super(message)

    this.name = "CajuPayError"
  }
}

export interface CreatePixInput {
  amountCents: number

  depositId: string

  checkoutUrl: string

  customer: {
    name: string
    email: string
    document: string
    phone: string
  }
}

export interface CajuPayPixResponse {
  payment_id: string
  provider: string
  pix_copy_paste?: string
  pix_qr_code?: string
  status: string
}

type JsonRecord = Record<string, unknown>

interface RequestContext {
  traceId: string
  depositId: string
  startedAt: number
}

// ==========================================
// LOGGER
// ==========================================

function logInfo(
  event: string,
  data: Record<string, unknown>
) {
  console.info(`[CAJUPAY_${event}]`, {
    timestamp: new Date().toISOString(),
    ...data,
  })
}

function logDebug(
  event: string,
  data: Record<string, unknown>
) {
  if (!DEBUG_ENABLED) return

  console.debug(`[CAJUPAY_${event}]`, {
    timestamp: new Date().toISOString(),
    ...data,
  })
}

function logError(
  event: string,
  data: Record<string, unknown>
) {
  console.error(`[CAJUPAY_${event}]`, {
    timestamp: new Date().toISOString(),
    ...data,
  })
}

// ==========================================
// UTILITÁRIOS
// ==========================================

function isRecord(
  value: unknown
): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  )
}

function getString(
  object: JsonRecord,
  key: string
): string | undefined {
  const value = object[key]

  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()

  return trimmed.length > 0
    ? trimmed
    : undefined
}

function getProviderErrorCode(
  data: JsonRecord
): string {
  const code = getString(data, "code")

  if (code) return code

  const error = getString(data, "error")

  if (error) return error

  if (isRecord(data.error)) {
    const nestedCode = getString(
      data.error,
      "code"
    )

    if (nestedCode) return nestedCode
  }

  return "PROVIDER_HTTP_ERROR"
}

function elapsedMs(startedAt: number) {
  return Math.round(performance.now() - startedAt)
}

// ==========================================
// NORMALIZAR TELEFONE
// ==========================================

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")

  if (
    digits.length === 10 ||
    digits.length === 11
  ) {
    return `+55${digits}`
  }

  if (
    digits.startsWith("55") &&
    (
      digits.length === 12 ||
      digits.length === 13
    )
  ) {
    return `+${digits}`
  }

  throw new CajuPayError(
    "Telefone inválido.",
    422,
    "INVALID_PHONE"
  )
}

// ==========================================
// NORMALIZAR DOCUMENTO
// ==========================================

function normalizeDocument(
  document: string
): string {
  const digits = document.replace(/\D/g, "")

  if (
    digits.length !== 11 &&
    digits.length !== 14
  ) {
    throw new CajuPayError(
      "CPF ou CNPJ inválido.",
      422,
      "INVALID_DOCUMENT"
    )
  }

  return digits
}

// ==========================================
// VALIDAR CPF
// ==========================================

function isValidCPF(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf)) {
    return false
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return false
  }

  for (let digit = 9; digit < 11; digit++) {
    let sum = 0

    for (let index = 0; index < digit; index++) {
      sum +=
        Number(cpf[index]) *
        (digit + 1 - index)
    }

    const remainder = (sum * 10) % 11

    const expected =
      remainder === 10 ? 0 : remainder

    if (expected !== Number(cpf[digit])) {
      return false
    }
  }

  return true
}

// ==========================================
// CREDENCIAIS
// ==========================================

function getCredentials() {
  if (process.env.PAYMENTS_ENABLED !== "true") {
    throw new CajuPayError(
      "Pagamentos desabilitados.",
      503,
      "PAYMENTS_DISABLED"
    )
  }

  const apiKey =
    process.env.CAJUPAY_API_KEY?.trim()

  const apiSecret =
    process.env.CAJUPAY_API_SECRET?.trim()

  if (!apiKey || !apiSecret) {
    throw new CajuPayError(
      "Credenciais CajuPay não configuradas.",
      503,
      "MISSING_CREDENTIALS"
    )
  }

  return {
    apiKey,
    apiSecret,
  }
}

// ==========================================
// ENDPOINT
// ==========================================

function getPixEndpoint(): URL {
  const apiUrl = (
    process.env.CAJUPAY_API_URL ||
    DEFAULT_API_URL
  ).trim()

  const pixPath = (
    process.env.CAJUPAY_PIX_PATH ||
    DEFAULT_PIX_PATH
  ).trim()

  let baseUrl: URL

  try {
    baseUrl = new URL(apiUrl)
  } catch {
    throw new CajuPayError(
      "CAJUPAY_API_URL inválida.",
      503,
      "INVALID_PROVIDER_URL"
    )
  }

  if (
    baseUrl.protocol !== "https:" ||
    baseUrl.username ||
    baseUrl.password
  ) {
    throw new CajuPayError(
      "A URL da CajuPay deve utilizar HTTPS.",
      503,
      "INVALID_PROVIDER_URL"
    )
  }

  if (
    !pixPath.startsWith("/") ||
    pixPath.startsWith("//")
  ) {
    throw new CajuPayError(
      "CAJUPAY_PIX_PATH inválido.",
      503,
      "INVALID_PROVIDER_PATH"
    )
  }

  const endpoint = new URL(
    pixPath,
    baseUrl
  )

  if (
    endpoint.protocol !== "https:" ||
    endpoint.origin !== baseUrl.origin
  ) {
    throw new CajuPayError(
      "Endpoint de pagamento inválido.",
      503,
      "INVALID_PROVIDER_URL"
    )
  }

  return endpoint
}

// ==========================================
// VALIDAR ENTRADA
// ==========================================

function validateInput(input: CreatePixInput) {
  if (
    !Number.isSafeInteger(input.amountCents) ||
    input.amountCents < 1000 ||
    input.amountCents > 1000000
  ) {
    throw new CajuPayError(
      "O valor deve estar entre R$ 10,00 e R$ 10.000,00.",
      422,
      "INVALID_AMOUNT"
    )
  }

  if (!input.depositId?.trim()) {
    throw new CajuPayError(
      "Identificador do depósito inválido.",
      422,
      "INVALID_DEPOSIT_ID"
    )
  }

  let checkoutUrl: URL

  try {
    checkoutUrl = new URL(input.checkoutUrl)
  } catch {
    throw new CajuPayError(
      "URL de checkout inválida.",
      422,
      "INVALID_CHECKOUT_URL"
    )
  }

  if (
    checkoutUrl.protocol !== "https:" ||
    checkoutUrl.username ||
    checkoutUrl.password
  ) {
    throw new CajuPayError(
      "O checkout precisa utilizar HTTPS.",
      422,
      "INVALID_CHECKOUT_URL"
    )
  }

  const name = input.customer.name?.trim()

  const email = input.customer.email
    ?.trim()
    .toLowerCase()

  if (!name || !email) {
    throw new CajuPayError(
      "Dados do cliente incompletos.",
      422,
      "INVALID_CUSTOMER"
    )
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new CajuPayError(
      "E-mail inválido.",
      422,
      "INVALID_EMAIL"
    )
  }

  const document = normalizeDocument(
    input.customer.document
  )

  if (
    document.length === 11 &&
    !isValidCPF(document)
  ) {
    throw new CajuPayError(
      "CPF inválido.",
      422,
      "INVALID_CPF"
    )
  }

  const phone = normalizePhone(
    input.customer.phone
  )

  return {
    checkoutUrl: checkoutUrl.toString(),

    customer: {
      name,
      email,
      document,
      phone,
    },
  }
}

// ==========================================
// LOG SEGURO DO PAYLOAD
// ==========================================

function logRequestPayload(
  context: RequestContext,
  endpoint: URL,
  payload: JsonRecord,
  customer: {
    name: string
    email: string
    document: string
    phone: string
  },
  idempotencyKey: string
) {
  logDebug("REQUEST_PAYLOAD", {
    traceId: context.traceId,

    depositId: context.depositId,

    endpoint: endpoint.toString(),

    method: "POST",

    idempotencyKey,

    payload: {
      amount_cents: payload.amount_cents,

      currency: payload.currency,

      description: payload.description,

      customer_ref: payload.customer_ref,

      partner_checkout_url:
        payload.partner_checkout_url,

      consumer: {
        hasName: Boolean(customer.name),

        nameLength: customer.name.length,

        hasEmail: Boolean(customer.email),

        emailFormatValid:
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            customer.email
          ),

        documentLength:
          customer.document.length,

        documentValid:
          customer.document.length === 11
            ? isValidCPF(customer.document)
            : null,

        phoneLength:
          customer.phone.length,

        phoneE164:
          /^\+[1-9]\d{7,14}$/.test(
            customer.phone
          ),
      },
    },

    credentials: {
      hasApiKey: Boolean(
        process.env.CAJUPAY_API_KEY
      ),

      hasApiSecret: Boolean(
        process.env.CAJUPAY_API_SECRET
      ),
    },
  })
}

// ==========================================
// RESPOSTA HTTP
// ==========================================

async function readCajuPayResponse(
  response: Response,
  context: RequestContext
): Promise<JsonRecord> {
  const raw = await response.text()

  const contentType =
    response.headers.get("content-type") ??
    "unknown"

  const requestId =
    response.headers.get("x-request-id") ??
    response.headers.get("x-correlation-id") ??
    null

  const durationMs = elapsedMs(
    context.startedAt
  )

  // ========================================
  // LOG DA RESPOSTA
  // ========================================

  logInfo("HTTP_RESPONSE", {
    traceId: context.traceId,

    depositId: context.depositId,

    status: response.status,

    statusText: response.statusText,

    ok: response.ok,

    durationMs,

    contentType,

    contentLength: raw.length,

    requestId,
  })

  // ========================================
  // INTERPRETAR JSON
  // ========================================

  let data: unknown

  try {
    data = JSON.parse(raw)
  } catch {
    // Não registrar o corpo de respostas
    // bem-sucedidas: podem conter dados Pix.
    if (!response.ok) {
      logError("NON_JSON_RESPONSE", {
        traceId: context.traceId,

        depositId: context.depositId,

        status: response.status,

        contentType,

        requestId,

        responseBody:
          DEBUG_ENABLED
            ? raw.slice(0, 300)
            : "[REDACTED]",
      })
    }

    throw new CajuPayError(
      response.ok
        ? "A CajuPay retornou uma resposta inválida."
        : `A CajuPay rejeitou a requisição (HTTP ${response.status}).`,

      response.ok ? 502 : response.status,

      response.ok
        ? "INVALID_RESPONSE"
        : "PROVIDER_NON_JSON_ERROR"
    )
  }

  if (!isRecord(data)) {
    logError("INVALID_RESPONSE_STRUCTURE", {
      traceId: context.traceId,

      depositId: context.depositId,

      status: response.status,

      responseType: Array.isArray(data)
        ? "array"
        : typeof data,
    })

    throw new CajuPayError(
      "A CajuPay retornou uma estrutura inválida.",
      502,
      "INVALID_RESPONSE_STRUCTURE"
    )
  }

  // ========================================
  // ERRO JSON
  // ========================================

  if (!response.ok) {
    const errorCode = getProviderErrorCode(
      data
    )

    logError("HTTP_ERROR", {
      traceId: context.traceId,

      depositId: context.depositId,

      status: response.status,

      errorCode,

      requestId,

      responseKeys: Object.keys(data),
    })

    throw new CajuPayError(
      "A CajuPay recusou a solicitação.",
      response.status,
      errorCode
    )
  }

  // ========================================
  // SUCESSO JSON
  // ========================================

  logDebug("JSON_RESPONSE", {
    traceId: context.traceId,

    depositId: context.depositId,

    responseKeys: Object.keys(data),

    hasPaymentId:
      typeof data.payment_id === "string",

    hasPixCopyPaste:
      typeof data.pix_copy_paste === "string",

    hasPixQrCode:
      typeof data.pix_qr_code === "string",

    status:
      typeof data.status === "string"
        ? data.status
        : null,
  })

  return data
}

// ==========================================
// VALIDAR RESPOSTA DO PIX
// ==========================================

function validatePixResponse(
  data: JsonRecord
): CajuPayPixResponse {
  const paymentId = getString(
    data,
    "payment_id"
  )

  if (!paymentId) {
    throw new CajuPayError(
      "A CajuPay não retornou o identificador do pagamento.",
      502,
      "MISSING_PAYMENT_ID"
    )
  }

  return {
    payment_id: paymentId,

    provider:
      getString(data, "provider") ??
      "CAJUPAY",

    pix_copy_paste:
      getString(data, "pix_copy_paste"),

    pix_qr_code:
      getString(data, "pix_qr_code"),

    status:
      getString(data, "status") ??
      "pending",
  }
}

// ==========================================
// CRIAR COBRANÇA PIX
// ==========================================

export async function createCajuPayPix(
  input: CreatePixInput
): Promise<CajuPayPixResponse> {
  const context: RequestContext = {
    traceId: randomUUID(),

    depositId: input.depositId,

    startedAt: performance.now(),
  }

  logInfo("CREATE_START", {
    traceId: context.traceId,

    depositId: context.depositId,

    amountCents: input.amountCents,
  })

  const controller = new AbortController()

  const timeout = setTimeout(() => {
    controller.abort()
  }, REQUEST_TIMEOUT)

  try {
    // ========================================
    // 1. CREDENCIAIS
    // ========================================

    const { apiKey, apiSecret } =
      getCredentials()

    logDebug("CONFIG", {
      traceId: context.traceId,

      paymentsEnabled:
        process.env.PAYMENTS_ENABLED === "true",

      hasApiKey: Boolean(apiKey),

      hasApiSecret: Boolean(apiSecret),

      timeoutMs: REQUEST_TIMEOUT,
    })

    // ========================================
    // 2. VALIDAR ENTRADA
    // ========================================

    const validated = validateInput(input)

    logDebug("INPUT_VALIDATED", {
      traceId: context.traceId,

      depositId: input.depositId,

      amountCents: input.amountCents,

      customer: {
        nameProvided:
          Boolean(validated.customer.name),

        emailProvided:
          Boolean(validated.customer.email),

        documentLength:
          validated.customer.document.length,

        phoneE164:
          /^\+[1-9]\d{7,14}$/.test(
            validated.customer.phone
          ),
      },
    })

    // ========================================
    // 3. ENDPOINT
    // ========================================

    const endpoint = getPixEndpoint()

    // ========================================
    // 4. PAYLOAD
    // ========================================

    const payload = {
      amount_cents: input.amountCents,

      currency: "BRL",

      description:
        `Deposito ${input.depositId}`,

      customer_ref: input.depositId,

      partner_checkout_url:
        validated.checkoutUrl,

      consumer: validated.customer,
    }

    const idempotencyKey =
      `deposit-${input.depositId}-pix`

    // ========================================
    // 5. LOG DA REQUISIÇÃO
    // ========================================

    logRequestPayload(
      context,
      endpoint,
      payload,
      validated.customer,
      idempotencyKey
    )

    logInfo("HTTP_REQUEST", {
      traceId: context.traceId,

      depositId: context.depositId,

      method: "POST",

      endpoint: endpoint.toString(),

      amountCents: input.amountCents,
    })

    // ========================================
    // 6. ENVIAR REQUISIÇÃO
    // ========================================

    const response = await fetch(
      endpoint.toString(),
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",

          "X-API-Key": apiKey,

          "X-API-Secret": apiSecret,

          "Idempotency-Key":
            idempotencyKey,
        },

        body: JSON.stringify(payload),

        signal: controller.signal,

        cache: "no-store",

        redirect: "error",
      }
    )

    // ========================================
    // 7. LER RESPOSTA
    // ========================================

    const data = await readCajuPayResponse(
      response,
      context
    )

    // ========================================
    // 8. VALIDAR PAGAMENTO
    // ========================================

    const payment = validatePixResponse(
      data
    )

    // ========================================
    // 9. LOG DE SUCESSO
    // ========================================

    logInfo("PIX_CREATED", {
      traceId: context.traceId,

      depositId: input.depositId,

      paymentId: payment.payment_id,

      status: payment.status,

      hasPixCopyPaste:
        Boolean(payment.pix_copy_paste),

      hasPixQrCode:
        Boolean(payment.pix_qr_code),

      durationMs: elapsedMs(
        context.startedAt
      ),
    })

    return payment
  } catch (error) {
    // ========================================
    // 10. ERRO CONHECIDO
    // ========================================

    if (error instanceof CajuPayError) {
      logError("CREATE_FAILED", {
        traceId: context.traceId,

        depositId: input.depositId,

        statusCode: error.statusCode,

        errorCode: error.code,

        message: error.message,

        durationMs: elapsedMs(
          context.startedAt
        ),
      })

      throw error
    }

    // ========================================
    // 11. TIMEOUT
    // ========================================

    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      logError("TIMEOUT", {
        traceId: context.traceId,

        depositId: input.depositId,

        timeoutMs: REQUEST_TIMEOUT,

        durationMs: elapsedMs(
          context.startedAt
        ),
      })

      throw new CajuPayError(
        "Tempo limite de comunicação com a CajuPay.",
        504,
        "TIMEOUT"
      )
    }

    // ========================================
    // 12. ERRO DE REDE
    // ========================================

    logError("NETWORK_ERROR", {
      traceId: context.traceId,

      depositId: input.depositId,

      errorName:
        error instanceof Error
          ? error.name
          : "UnknownError",

      durationMs: elapsedMs(
        context.startedAt
      ),
    })

    throw new CajuPayError(
      "Falha de comunicação com a CajuPay.",
      502,
      "NETWORK_ERROR"
    )
  } finally {
    clearTimeout(timeout)
  }
}