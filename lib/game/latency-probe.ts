import "server-only"

import { GAME_CONFIG } from "@/lib/game/config"

export function calculateLatencyCompensation(
  roundTripSamples: number[]
) {
  const validSamples = roundTripSamples
    .filter(
      (sample) =>
        Number.isFinite(sample) &&
        sample >= 0 &&
        sample <= GAME_CONFIG.maxAcceptedRttMs
    )
    .sort((a, b) => a - b)
    .slice(0, GAME_CONFIG.maxLatencySamples)

  if (validSamples.length === 0) {
    return 0
  }

  // Estimativa de latência de ida:
  // metade da menor amostra.
  const estimatedOneWayMs =
    validSamples[0] / 2

  return Math.round(
    Math.min(
      estimatedOneWayMs,
      GAME_CONFIG.maxLatencyCompensationMs
    )
  )
}