import { calculateMultiplier } from "../lib/game/multiplier"
import { GAME_CONFIG } from "../lib/game/config"

const tests = [
  {
    name: "Acertou antes do alvo",
    elapsedMs: 4893,
    expected: true,
  },
  {
    name: "Acertou depois do alvo",
    elapsedMs: 5224,
    expected: true,
  },
  {
    name: "Errou depois do alvo",
    elapsedMs: 5300,
    expected: false,
  },
  {
    name: "Errou antes do alvo",
    elapsedMs: 4700,
    expected: false,
  },
]

for (const test of tests) {
  const result = calculateMultiplier({
    targetMs: 5000,
    elapsedMs: test.elapsedMs,
    stakeCents: 50,
    toleranceMs: GAME_CONFIG.toleranceMs,
    multiplier: GAME_CONFIG.multiplier,
  })

  const passed = result.won === test.expected

  console.log({
    teste: test.name,
    tempo: test.elapsedMs / 1000,
    ganhou: result.won,
    retorno: `R$ ${(result.payoutCents / 100).toFixed(2)}`,
    resultado: passed ? "PASSOU" : "FALHOU",
  })

  if (!passed) {
    throw new Error(`Teste falhou: ${test.name}`)
  }
}