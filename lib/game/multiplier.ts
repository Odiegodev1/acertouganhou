import { GAME_CONFIG } from "./config"

interface CheckMultiplierParams {
  targetMs: number
  elapsedMs: number
}

export function checkMultiplier({
  targetMs,
  elapsedMs,
}: CheckMultiplierParams) {
  if (
    !Number.isFinite(targetMs) ||
    !Number.isFinite(elapsedMs) ||
    targetMs <= 0 ||
    elapsedMs < 0
  ) {
    throw new Error("INVALID_GAME_TIME")
  }

  const differenceMs = Math.abs(
    elapsedMs - targetMs
  )

  const won =
    differenceMs <= GAME_CONFIG.toleranceMs

  return {
    won,
    status: won ? ("WON" as const) : ("LOST" as const),
    differenceMs,
    toleranceMs: GAME_CONFIG.toleranceMs,
    multiplier: GAME_CONFIG.multiplier,
  }
}