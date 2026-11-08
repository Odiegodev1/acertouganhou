import { Trophy, X } from "lucide-react"
import { formatGameTime } from "@/lib/game/format"

interface JogoResultadoProps {
  won: boolean
  elapsedMs: number
  targetMs: number
}

export function JogoResultado({
  won,
  elapsedMs,
  targetMs,
}: JogoResultadoProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        won
          ? "border-[#c8f31d]/20 bg-[#c8f31d]/5"
          : "border-red-400/20 bg-red-400/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-lg ${
            won
              ? "bg-[#c8f31d]/10 text-[#c8f31d]"
              : "bg-red-400/10 text-red-400"
          }`}
        >
          {won ? <Trophy /> : <X />}
        </div>

        <div>
          <h3 className="font-bold text-white">
            {won ? "Você acertou!" : "Não foi dessa vez"}
          </h3>

          <p className="mt-1 text-xs text-zinc-400">
            Tempo oficial registrado pelo servidor:
          </p>

          <p className="mt-2 font-mono text-lg font-bold text-white">
            {formatGameTime(elapsedMs)}s
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Objetivo: {formatGameTime(targetMs)}s
          </p>
        </div>
      </div>
    </div>
  )
}