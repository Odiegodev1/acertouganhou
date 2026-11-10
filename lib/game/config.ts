export const GAME_CONFIG = {
    mode: "MULTIPLIER",
    multiplier: 0,
  
    // Margem de acerto no tempo do jogo.
    toleranceMs: 0,
  
    // Tempo máximo real permitido.
    maxDurationMs: 300_000,
  
    // Compensação máxima de latência real.
    maxLatencyCompensationMs: 150,
  
    // Quantidade máxima de amostras utilizadas.
    maxLatencySamples: 8,
  
    // RTT máximo aceito como amostra.
    maxAcceptedRttMs: 1000,
  } as const