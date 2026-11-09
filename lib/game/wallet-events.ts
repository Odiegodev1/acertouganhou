export const GAME_WALLET_UPDATED = "game-wallet-updated"

export function notifyGameWalletUpdated() {
  if (typeof window === "undefined") return

  window.dispatchEvent(
    new Event(GAME_WALLET_UPDATED)
  )
}