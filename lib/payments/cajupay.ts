import "server-only";

import { randomUUID } from "node:crypto";

const API_URL = "https://api.cajupay.com.br";
const PIX_PATH = "/api/payments/pix";
const TIMEOUT_MS = 15000;

export interface CreatePixInput {
  amountCents: number;
  depositId: string;
  checkoutUrl: string;
  customer: {
    name: string;
    email: string;
    document: string;
    phone: string;
  };
}

export interface CajuPayPixResponse {
  payment_id: string;
  provider: string;
  pix_copy_paste?: string;
  pix_qr_code?: string;
  status: string;
}

export class CajuPayError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly definitive = false,
    public readonly requestId: string | null = null,
  ) {
    super(message);
    this.name = "CajuPayError";
  }
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

function validCPF(value: string): boolean {
  const cpf = digits(value);

  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  for (let position = 9; position <= 10; position++) {
    let sum = 0;

    for (let i = 0; i < position; i++) {
      sum += Number(cpf[i]) * (position + 1 - i);
    }

    const remainder = (sum * 10) % 11;
    const expected = remainder === 10 ? 0 : remainder;

    if (expected !== Number(cpf[position])) {
      return false;
    }
  }

  return true;
}

function normalizePhone(value: string): string {
  const phone = digits(value);

  const national =
    phone.startsWith("55") &&
    (phone.length === 12 || phone.length === 13)
      ? phone.slice(2)
      : phone;

  if (!/^\d{10,11}$/.test(national)) {
    throw new CajuPayError(
      "Telefone inválido.",
      422,
      "INVALID_PHONE",
      true,
    );
  }

  return `+55${national}`;
}

function getEndpoint(): URL {
  const baseValue = process.env.CAJUPAY_API_URL?.trim() || API_URL;
  const path = process.env.CAJUPAY_PIX_PATH?.trim() || PIX_PATH;

  let base: URL;

  try {
    base = new URL(baseValue);
  } catch {
    throw new CajuPayError(
      "URL da CajuPay inválida.",
      503,
      "INVALID_ENDPOINT",
      true,
    );
  }

  if (
    base.protocol !== "https:" ||
    base.username ||
    base.password ||
    !path.startsWith("/") ||
    path.startsWith("//")
  ) {
    throw new CajuPayError(
      "Configuração da CajuPay inválida.",
      503,
      "INVALID_ENDPOINT",
      true,
    );
  }

  const url = new URL(path, base);

  if (url.origin !== base.origin) {
    throw new CajuPayError(
      "Endpoint não permitido.",
      503,
      "INVALID_ENDPOINT",
      true,
    );
  }

  return url;
}

function getCredentials() {
  if (process.env.PAYMENTS_ENABLED !== "true") {
    throw new CajuPayError(
      "Pagamentos desabilitados.",
      503,
      "PAYMENTS_DISABLED",
      true,
    );
  }

  const key = process.env.CAJUPAY_API_KEY?.trim();
  const secret = process.env.CAJUPAY_API_SECRET?.trim();

  if (!key || !secret) {
    throw new CajuPayError(
      "Credenciais da CajuPay ausentes.",
      503,
      "MISSING_CREDENTIALS",
      true,
    );
  }

  return { key, secret };
}

function getCheckoutUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new CajuPayError(
      "Checkout inválido.",
      422,
      "INVALID_CHECKOUT",
      true,
    );
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password
  ) {
    throw new CajuPayError(
      "Checkout precisa utilizar HTTPS.",
      422,
      "INVALID_CHECKOUT",
      true,
    );
  }

  return url.toString();
}

function buildPayload(input: CreatePixInput) {
  if (
    !Number.isSafeInteger(input.amountCents) ||
    input.amountCents < 1000 ||
    input.amountCents > 1000000
  ) {
    throw new CajuPayError(
      "Valor inválido.",
      422,
      "INVALID_AMOUNT",
      true,
    );
  }

  if (!input.depositId?.trim()) {
    throw new CajuPayError(
      "Depósito inválido.",
      422,
      "INVALID_DEPOSIT",
      true,
    );
  }

  const name = input.customer.name.trim();
  const email = input.customer.email.trim().toLowerCase();
  const document = digits(input.customer.document);

  if (
    name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !validCPF(document)
  ) {
    throw new CajuPayError(
      "Dados do consumidor inválidos.",
      422,
      "INVALID_CUSTOMER",
      true,
    );
  }

  const phone = normalizePhone(input.customer.phone);

  // Estrutura mantida da integração existente.
  // Ainda depende de validação com a documentação da CajuPay.
  return {
    amount_cents: input.amountCents,
    currency: "BRL",
    description: `Deposito ${input.depositId}`,
    customer_ref: input.depositId,
    partner_checkout_url: getCheckoutUrl(input.checkoutUrl),
    consumer: {
      name,
      email,
      document,
      phone,
    },
  };
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function getErrorCode(data: unknown, raw: string): string {
  if (isRecord(data)) {
    if (typeof data.code === "string") {
      return data.code;
    }

    if (typeof data.error === "string") {
      return data.error;
    }
  }

  // A CajuPay já retornou "payment_create_failed" em texto puro.
  const text = raw.trim();

  if (/^[a-z][a-z0-9_]{0,100}$/i.test(text)) {
    return text;
  }

  return "PROVIDER_REJECTED";
}

function getRequestId(response: Response): string | null {
  return (
    response.headers.get("request-id") ??
    response.headers.get("x-request-id") ??
    response.headers.get("x-correlation-id")
  );
}

export async function createCajuPayPix(
  input: CreatePixInput,
): Promise<CajuPayPixResponse> {
  const traceId = randomUUID();

  const { key, secret } = getCredentials();
  const url = getEndpoint();
  const payload = buildPayload(input);

  const idempotencyKey = `deposit-${input.depositId}-pix`;

  console.info("[CAJUPAY_REQUEST]", {
    traceId,
    depositId: input.depositId,
    endpoint: url.toString(),
    amountCents: input.amountCents,
  });

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": key,
        "X-API-Secret": secret,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timeout =
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name);

    console.error("[CAJUPAY_NETWORK_ERROR]", {
      traceId,
      depositId: input.depositId,
      timeout,
    });

    throw new CajuPayError(
      timeout
        ? "A CajuPay demorou para responder."
        : "Falha de comunicação com a CajuPay.",
      timeout ? 504 : 502,
      timeout ? "TIMEOUT" : "NETWORK_ERROR",
      false,
    );
  }

  const requestId = getRequestId(response);

  let raw: string;

  try {
    raw = await response.text();
  } catch {
    throw new CajuPayError(
      "Não foi possível ler a resposta da CajuPay.",
      502,
      "RESPONSE_READ_ERROR",
      false,
      requestId,
    );
  }

  const data = parseJson(raw);

  console.info("[CAJUPAY_RESPONSE]", {
    traceId,
    depositId: input.depositId,
    httpStatus: response.status,
    requestId,
    responseFormat: data === null ? "text" : "json",
  });

  if (!response.ok) {
    const code = getErrorCode(data, raw);

    // Somente erros explicitamente conhecidos como rejeições
    // definitivas são tratados dessa maneira.
    const definitiveCodes = new Set([
      "invalid_amount",
      "below_minimum_charge_amount",
      "missing_idempotency_key",
      "invalid_partner_checkout_url",
      "https_required",
      "idempotency_key_reuse_mismatch",
    ]);

    const definitive =
      [400, 409].includes(response.status) &&
      definitiveCodes.has(code);

    console.error("[CAJUPAY_PAYMENT_FAILED]", {
      traceId,
      depositId: input.depositId,
      httpStatus: response.status,
      providerCode: code,
      requestId,
      definitive,
    });

    throw new CajuPayError(
      `Falha na criação do Pix: ${code}`,
      response.status,
      code,
      definitive,
      requestId,
    );
  }

  if (!isRecord(data)) {
    throw new CajuPayError(
      "A CajuPay retornou uma resposta inesperada.",
      502,
      "INVALID_RESPONSE",
      false,
      requestId,
    );
  }

  const paymentId = data.payment_id;

  if (
    typeof paymentId !== "string" ||
    !paymentId.trim()
  ) {
    throw new CajuPayError(
      "Pagamento criado sem identificador confirmado.",
      502,
      "MISSING_PAYMENT_ID",
      false,
      requestId,
    );
  }

  const result: CajuPayPixResponse = {
    payment_id: paymentId,
    provider:
      typeof data.provider === "string"
        ? data.provider
        : "cajupay",
    status:
      typeof data.status === "string"
        ? data.status
        : "pending",
    pix_copy_paste:
      typeof data.pix_copy_paste === "string"
        ? data.pix_copy_paste
        : undefined,
    pix_qr_code:
      typeof data.pix_qr_code === "string"
        ? data.pix_qr_code
        : undefined,
  };

  console.info("[CAJUPAY_PAYMENT_CREATED]", {
    traceId,
    depositId: input.depositId,
    paymentId: result.payment_id,
    status: result.status,
    hasPixCode: Boolean(result.pix_copy_paste),
    hasQrCode: Boolean(result.pix_qr_code),
  });

  return result;
}