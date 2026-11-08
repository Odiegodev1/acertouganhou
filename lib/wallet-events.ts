export const WALLET_UPDATED_EVENT = "acertouganhou:wallet-updated"

export function notifyWalletUpdated() {
  if (typeof window === "undefined") return

  window.dispatchEvent(
    new CustomEvent(WALLET_UPDATED_EVENT)
  )
}