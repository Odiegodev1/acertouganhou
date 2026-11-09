import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

export function verifyCajuPayWebhook(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.CAJUPAY_WEBHOOK_SECRET

  if (!secret || !signatureHeader) {
    return false
  }

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, ...value] = part.trim().split("=")
      return [key, value.join("=")]
    })
  )

  const timestamp = parts.t
  const signature = parts.v1

  if (!timestamp || !signature) {
    return false
  }

  if (!/^\d+$/.test(timestamp)) {
    return false
  }

  if (!/^[a-f0-9]{64}$/i.test(signature)) {
    return false
  }

  const age = Math.abs(
    Math.floor(Date.now() / 1000) - Number(timestamp)
  )

  if (age > 300) {
    return false
  }

  const payload = `${timestamp}.${rawBody}`

  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest()

  const received = Buffer.from(signature, "hex")

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  )
}