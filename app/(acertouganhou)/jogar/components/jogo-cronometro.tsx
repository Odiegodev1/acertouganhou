"use client"

import { Keyboard, Target } from "lucide-react"
import { formatGameTime } from "@/lib/game/format"

interface JogoCronometroProps {
  elapsed: number
  targetMs: number
  running: boolean
}

export function JogoCronometro({
  elapsed,
  targetMs,
  running,
}: JogoCronometroProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-[#c8f31d]/15 bg-[#c8f31d]/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Target className="size-4 text-[#c8f31d]" />
          Seu objetivo
        </div>

        <span className="font-mono text-lg font-bold text-[#c8f31d]">
          {formatGameTime(targetMs)}s
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#090d0a] px-4 py-8 text-center">
        <div className="mb-5 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <span
            className={`size-2 rounded-full ${
              running
                ? "animate-pulse bg-[#c8f31d]"
                : "bg-zinc-600"
            }`}
          />

          {running ? "Cronômetro em andamento" : "Cronômetro"}
        </div>

        <div
          role="timer"
          className="font-mono text-[clamp(3rem,14vw,5rem)] font-bold tracking-tighter text-white tabular-nums"
        >
          {formatGameTime(elapsed)}
        </div>

        <p className="mt-3 text-[11px] uppercase tracking-widest text-zinc-600">
          Segundos · Milésimos
        </p>

        <div className="mt-6 hidden items-center justify-center gap-2 text-xs text-zinc-500 md:flex">
          <Keyboard className="size-4" />
          <kbd className="rounded-md border border-white/10 px-2 py-1 text-white">
            ESPAÇO
          </kbd>
          para iniciar ou parar
        </div>
      </div>
    </div>
  )
}