"use client"

import * as React from "react"
import Image, { type StaticImageData } from "next/image"
import { toast } from "sonner"

import {
  ArrowRight,
  Check,
  Clock3,
  Gamepad2,
  LoaderCircle,
  RotateCcw,
  Target,
  Trophy,
  Wallet,
  X,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { getGame } from "./form/actions/game/get-game"
import { startGame } from "./form/actions/game/start-game"
import { stopGame } from "./form/actions/game/stop-game"



interface DialogJogoProps {
  id: string
  nome: string
  valor: number
  tipo: string
  img?: StaticImageData
  time: number
}

type GamePhase =
  | "idle"
  | "loading"
  | "ready"
  | "running"
  | "stopping"
  | "finished"

type GameResult = {
  elapsedMs: number
  targetMs: number
  status: "WON" | "LOST"
}

function formatTime(ms: number) {
  return (ms / 1000).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function DialogJogo({
  id,
  nome,
  valor,
  tipo,
  img,
  time,
}: DialogJogoProps) {
  const [open, setOpen] = React.useState(false)
  const [phase, setPhase] = React.useState<GamePhase>("idle")

  const [elapsedMs, setElapsedMs] = React.useState(0)
  const [targetMs, setTargetMs] = React.useState(time * 1000)
  const [speedFactor, setSpeedFactor] = React.useState(1000)

  const [attemptId, setAttemptId] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<GameResult | null>(null)

  const startedAtRef = React.useRef<number | null>(null)
  const stoppedRef = React.useRef(false)
  const frameRef = React.useRef<number | null>(null)

  const phaseRef = React.useRef<GamePhase>("idle")
  const attemptIdRef = React.useRef<string | null>(null)
  const speedFactorRef = React.useRef(1000)

  const setGamePhase = React.useCallback((value: GamePhase) => {
    phaseRef.current = value
    setPhase(value)
  }, [])

  const resetVisual = React.useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    startedAtRef.current = null
    stoppedRef.current = false
    attemptIdRef.current = null
    speedFactorRef.current = 1000

    setElapsedMs(0)
    setAttemptId(null)
    setResult(null)
    setSpeedFactor(1000)
    setGamePhase("idle")
  }, [setGamePhase])

  React.useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadPrize() {
      setGamePhase("loading")

      try {
        const response = await getGame(id)

        if (cancelled) return

        if (!response.success) {
          toast.error(response.error)
          setGamePhase("idle")
          return
        }

        setTargetMs(response.prize.targetMs)
        setSpeedFactor(response.prize.speedFactor)
        speedFactorRef.current = response.prize.speedFactor

        setGamePhase("ready")
      } catch {
        if (!cancelled) {
          toast.error("Não foi possível carregar o desafio.")
          setGamePhase("idle")
        }
      }
    }

    loadPrize()

    return () => {
      cancelled = true
    }
  }, [open, id, setGamePhase])

  React.useEffect(() => {
    if (phase !== "running") return

    let frame = 0

    function tick() {
      if (startedAtRef.current === null) return

      const realElapsedMs =
        performance.now() - startedAtRef.current

      const gameElapsedMs =
        (realElapsedMs * speedFactorRef.current) / 1000

      setElapsedMs(gameElapsedMs)

      frame = requestAnimationFrame(tick)
      frameRef.current = frame
    }

    frame = requestAnimationFrame(tick)
    frameRef.current = frame

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [phase])

  const handleStart = React.useCallback(async () => {
    if (phaseRef.current !== "ready") return

    setGamePhase("loading")

    try {
      const response = await startGame(id)

      if (!response.success) {
        toast.error(response.error)
        setGamePhase("ready")
        return
      }

      attemptIdRef.current = response.attemptId
      speedFactorRef.current = response.speedFactor

      setAttemptId(response.attemptId)
      setTargetMs(response.targetMs)
      setSpeedFactor(response.speedFactor)

      setResult(null)
      setElapsedMs(0)

      stoppedRef.current = false
      startedAtRef.current = performance.now()

      setGamePhase("running")
    } catch {
      toast.error("Não foi possível iniciar a tentativa.")
      setGamePhase("ready")
    }
  }, [id, setGamePhase])

  const handleStop = React.useCallback(async () => {
    if (
      phaseRef.current !== "running" ||
      stoppedRef.current ||
      startedAtRef.current === null ||
      !attemptIdRef.current
    ) {
      return
    }

    stoppedRef.current = true

    const stoppedAt = performance.now()

    const realElapsedMs =
      stoppedAt - startedAtRef.current

    const finalElapsedMs = Math.round(
      (realElapsedMs * speedFactorRef.current) / 1000
    )

    setElapsedMs(finalElapsedMs)
    setGamePhase("stopping")

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    try {
      const response = await stopGame(
        attemptIdRef.current,
        finalElapsedMs
      )

      if (!response.success) {
        toast.error(response.error)
        setGamePhase("finished")

        setResult({
          elapsedMs: finalElapsedMs,
          targetMs,
          status: "LOST",
        })

        return
      }

      setElapsedMs(response.elapsedMs)

      setResult({
        elapsedMs: response.elapsedMs,
        targetMs: response.targetMs,
        status: response.status,
      })

      setGamePhase("finished")
    } catch {
      toast.error("Não foi possível encerrar o jogo.")

      setResult({
        elapsedMs: finalElapsedMs,
        targetMs,
        status: "LOST",
      })

      setGamePhase("finished")
    }
  }, [setGamePhase, targetMs])

  React.useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (
        event.code !== "Space" ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return
      }

      const target = event.target as HTMLElement | null

      if (
        target?.closest(
          "input, textarea, select, [contenteditable='true']"
        )
      ) {
        return
      }

      if (phaseRef.current !== "running") return

      event.preventDefault()
      void handleStop()
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open, handleStop])

  function handleOpenChange(nextOpen: boolean) {
    if (
      !nextOpen &&
      (phaseRef.current === "running" ||
        phaseRef.current === "stopping" ||
        phaseRef.current === "loading")
    ) {
      toast.info("Finalize a tentativa antes de fechar.")
      return
    }

    setOpen(nextOpen)

    if (!nextOpen) {
      resetVisual()
    }
  }

  const differenceMs = result
    ? result.elapsedMs - result.targetMs
    : 0

  const isRunning = phase === "running"
  const isStopping = phase === "stopping"
  const isFinished = phase === "finished"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            className="
              h-11 w-full rounded-xl
              bg-[#C8F31D]
              text-sm font-bold text-[#101510]
              transition-colors
              hover:bg-[#D9FF53]
            "
          >
            <Gamepad2 className="mr-2 size-4" />
            Jogar agora
            <ArrowRight className="ml-auto size-4" />
          </Button>
        }
      />

      <DialogContent
        showCloseButton={
          phase !== "running" &&
          phase !== "stopping" &&
          phase !== "loading"
        }
        className="
          max-h-[95dvh] w-[calc(100%-24px)]
          max-w-md overflow-y-auto
          rounded-2xl border border-white/10
          bg-[#101510] p-0 text-white
          sm:rounded-3xl
        "
      >
        <div className="p-5 sm:p-6">
          <DialogHeader className="text-left">
            <div className="mb-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#C8F31D]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8F31D]">
                AcertouGanhou
              </span>
            </div>

            <DialogTitle className="text-xl font-bold text-white">
              {nome}
            </DialogTitle>

            <DialogDescription className="text-xs text-zinc-500">
              {tipo} · Participação de {formatCurrency(valor)}
            </DialogDescription>
          </DialogHeader>

          {/* PRÊMIO */}
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#090c0a] p-3">
            {img ? (
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-black">
                <Image
                  src={img}
                  alt={nome}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-[#C8F31D]/10">
                <Trophy className="size-6 text-[#C8F31D]" />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                Desafio selecionado
              </p>

              <p className="mt-1 truncate text-sm font-bold text-white">
                {nome}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Acerte o tempo exato.
              </p>
            </div>
          </div>

          {/* ALVO */}
          <div className="mt-5 flex items-center justify-between rounded-xl border border-[#C8F31D]/15 bg-[#C8F31D]/[0.05] px-4 py-3">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-[#C8F31D]" />

              <span className="text-xs font-medium text-zinc-400">
                Tempo-alvo
              </span>
            </div>

            <span className="font-mono text-lg font-bold tabular-nums text-[#C8F31D]">
              {formatTime(targetMs)}s
            </span>
          </div>

          {/* CRONÔMETRO */}
          <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080b09] px-4 py-9 text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,243,29,0.055),transparent_65%)]" />

            <div className="relative">
              <div className="mb-4 flex items-center justify-center gap-2">
                <Clock3 className="size-4 text-zinc-500" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {isFinished ? "Seu tempo" : "Cronômetro"}
                </span>
              </div>

              <div
                className={`
                  font-mono text-[clamp(2.8rem,12vw,4.5rem)]
                  font-black tracking-[-0.06em]
                  tabular-nums
                  ${
                    isFinished
                      ? "text-white"
                      : "text-[#C8F31D]"
                  }
                `}
              >
                {formatTime(elapsedMs)}
                <span className="ml-1 text-lg font-semibold text-zinc-500">
                  s
                </span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <span
                  className={`size-1.5 rounded-full ${
                    isRunning
                      ? "animate-pulse bg-[#C8F31D]"
                      : "bg-zinc-600"
                  }`}
                />

                <span className="text-xs text-zinc-500">
                  {phase === "idle" && "Aguardando desafio"}
                  {phase === "loading" && "Preparando desafio..."}
                  {phase === "ready" && "Pronto para começar"}
                  {phase === "running" && "Cronômetro em andamento"}
                  {phase === "stopping" && "Registrando resultado..."}
                  {phase === "finished" && "Tentativa finalizada"}
                </span>
              </div>
            </div>
          </div>

          {/* RESULTADO */}
          {result && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2">
                {result.status === "WON" ? (
                  <Check className="size-5 text-[#C8F31D]" />
                ) : (
                  <X className="size-5 text-zinc-400" />
                )}

                <p className="text-sm font-bold text-white">
                  {result.status === "WON"
                    ? "Desafio concluído!"
                    : "Tentativa encerrada"}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-zinc-500">
                    Esperado
                  </p>

                  <p className="mt-1 font-mono text-sm font-bold text-white">
                    {formatTime(result.targetMs)}s
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-500">
                    Seu tempo
                  </p>

                  <p className="mt-1 font-mono text-sm font-bold text-white">
                    {formatTime(result.elapsedMs)}s
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-500">
                    Diferença
                  </p>

                  <p className="mt-1 font-mono text-sm font-bold text-white">
                    {differenceMs > 0 ? "+" : differenceMs < 0 ? "-" : ""}
                    {formatTime(Math.abs(differenceMs))}s
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                Tempo registrado para demonstração.
                Esta tentativa não concede premiação real.
              </p>
            </div>
          )}

          {/* BOTÕES */}
          <div className="mt-5 space-y-3">
            {phase === "ready" && (
              <Button
                onClick={handleStart}
                className="h-12 w-full rounded-xl bg-[#C8F31D] text-sm font-bold text-[#101510] hover:bg-[#D9FF53]"
              >
                <Gamepad2 className="mr-2 size-4" />
                Iniciar desafio
              </Button>
            )}

            {phase === "loading" && (
              <Button
                isDisabled
                className="h-12 w-full rounded-xl bg-[#C8F31D] text-[#101510]"
              >
                <LoaderCircle className="mr-2 size-4 animate-spin" />
                Aguarde...
              </Button>
            )}

            {isRunning && (
              <Button
                onClick={handleStop}
                className="h-14 w-full rounded-xl bg-[#C8F31D] text-base font-black text-[#101510] hover:bg-[#D9FF53]"
              >
                <Target className="mr-2 size-5" />
                PARAR AGORA
              </Button>
            )}

            {isStopping && (
              <Button
                isDisabled
                className="h-12 w-full rounded-xl bg-white/10 text-white"
              >
                <LoaderCircle className="mr-2 size-4 animate-spin" />
                Registrando...
              </Button>
            )}

            {isFinished && (
              <Button
                onClick={() => {
                  resetVisual()
                  setGamePhase("ready")
                }}
                className="h-12 w-full rounded-xl bg-[#C8F31D] font-bold text-[#101510] hover:bg-[#D9FF53]"
              >
                <RotateCcw className="mr-2 size-4" />
                Jogar novamente
              </Button>
            )}

            {phase === "idle" && (
              <Button
                isDisabled
                className="h-12 w-full rounded-xl bg-white/10 text-zinc-400"
              >
                Desafio indisponível
              </Button>
            )}
          </div>

          {/* ATALHO DESKTOP */}
          {isRunning && (
            <div className="mt-4 hidden items-center justify-center gap-2 text-xs text-zinc-500 md:flex">
              Pressione

              <kbd className="rounded-md border border-white/15 bg-white/5 px-2 py-1 font-mono text-white">
                ESPAÇO
              </kbd>

              para parar
            </div>
          )}

          {/* INFORMAÇÃO */}
          <div className="mt-5 flex items-center justify-center gap-2 border-t border-white/[0.06] pt-4">
            <Wallet className="size-3.5 text-zinc-600" />

            <span className="text-[11px] text-zinc-600">
              Jogo demonstrativo com créditos fictícios.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}