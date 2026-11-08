"use client"

import * as React from "react"
import Image, { type StaticImageData } from "next/image"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"

import {
  ArrowLeft,
  Check,
  Clock3,
  Gamepad2,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Wallet,
  X,
  Zap,
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

import { notifyWalletUpdated } from "@/lib/wallet-events"
import { GAME_CONFIG } from "@/lib/game/config"

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
  | "error"

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

// =====================================================
// RESULTADO DO JOGO
// =====================================================

interface ResultadoJogoProps {
  result: GameResult
  nome: string
  valor: number
  onRetry: () => void
  onClose: () => void
}

function ResultadoJogo({
  result,
  nome,
  valor,
  onRetry,
  onClose,
}: ResultadoJogoProps) {
  const ganhou = result.status === "WON"

  const differenceMs = Math.abs(
    result.elapsedMs - result.targetMs
  )

  const retornoSimulado = valor * GAME_CONFIG.multiplier

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
      }}
      className="relative mt-6 overflow-hidden text-center"
    >
      <div
        className={`pointer-events-none absolute left-1/2 top-0 h-52 w-72 -translate-x-1/2 rounded-full blur-[90px] ${
          ganhou
            ? "bg-[#C8F31D]/15"
            : "bg-red-500/10"
        }`}
      />

      <motion.div
        initial={{ scale: 0.5, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 16,
        }}
        className={`relative mx-auto mb-5 flex size-24 items-center justify-center rounded-full border ${
          ganhou
            ? "border-[#C8F31D]/25 bg-[#C8F31D]/10"
            : "border-red-400/20 bg-red-400/10"
        }`}
      >
        {ganhou ? (
          <Trophy className="size-11 text-[#C8F31D]" />
        ) : (
          <Target className="size-11 text-red-400" />
        )}

        {ganhou && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -right-2 -top-2"
          >
            <Sparkles className="size-6 text-[#C8F31D]" />
          </motion.div>
        )}
      </motion.div>

      <span
        className={`relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] ${
          ganhou
            ? "border-[#C8F31D]/20 bg-[#C8F31D]/10 text-[#C8F31D]"
            : "border-red-400/20 bg-red-400/10 text-red-400"
        }`}
      >
        {ganhou ? (
          <>
            <Check className="size-3" />
            Desafio concluído
          </>
        ) : (
          <>
            <X className="size-3" />
            Desafio encerrado
          </>
        )}
      </span>

      <h2 className="relative mt-4 text-3xl font-black tracking-tight sm:text-4xl">
        {ganhou ? (
          <>
            Você{" "}
            <span className="text-[#C8F31D]">
              acertou!
            </span>
          </>
        ) : (
          <>
            Você{" "}
            <span className="text-red-400">
              perdeu!
            </span>
          </>
        )}
      </h2>

      <p className="relative mx-auto mt-3 max-w-xs text-sm leading-relaxed text-zinc-400">
        {ganhou
          ? `Parabéns! Você concluiu o desafio ${nome}.`
          : "Não foi dessa vez! Tente novamente e mostre sua precisão."}
      </p>

      {/* RETORNO SIMULADO */}
      {ganhou && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mt-6 rounded-2xl border border-[#C8F31D]/25 bg-[#C8F31D]/[0.07] p-5"
        >
          <div className="flex items-center justify-center gap-2">
            <Zap className="size-4 text-[#C8F31D]" />

            <span className="text-xs font-semibold uppercase tracking-widest text-[#C8F31D]">
              Multiplicador {GAME_CONFIG.multiplier}x
            </span>
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            Retorno demonstrativo
          </p>

          <p className="mt-1 text-4xl font-black tracking-tight text-[#C8F31D]">
            {formatCurrency(retornoSimulado)}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            {formatCurrency(valor)} ×{" "}
            {GAME_CONFIG.multiplier}
          </p>
        </motion.div>
      )}

      {/* TEMPOS */}
      <div className="relative mt-5 grid grid-cols-2 gap-3 text-left">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="text-[11px] text-zinc-500">
            Tempo-alvo
          </p>

          <p className="mt-2 font-mono text-xl font-bold tabular-nums text-white">
            {formatTime(result.targetMs)}
            <span className="ml-1 text-xs text-zinc-500">
              s
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="text-[11px] text-zinc-500">
            Seu tempo
          </p>

          <p
            className={`mt-2 font-mono text-xl font-bold tabular-nums ${
              ganhou
                ? "text-[#C8F31D]"
                : "text-red-400"
            }`}
          >
            {formatTime(result.elapsedMs)}
            <span className="ml-1 text-xs text-zinc-500">
              s
            </span>
          </p>
        </div>
      </div>

      {/* DIFERENÇA */}
      <div className="relative mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <p className="text-xs text-zinc-400">
          Diferença do alvo:{" "}
          <span className="font-bold text-white">
            {formatTime(differenceMs)}s
          </span>
        </p>

        <p className="mt-1 text-[11px] text-zinc-500">
          Margem configurada: ±
          {formatTime(GAME_CONFIG.toleranceMs)}s
        </p>
      </div>

      <p className="relative mt-4 text-[11px] leading-relaxed text-zinc-500">
        Simulação com créditos fictícios.
        Nenhum valor real é creditado por esta interface.
      </p>

      <div className="relative mt-6 space-y-3">
        <Button
          type="button"
          onClick={onRetry}
          className="h-12 w-full rounded-xl bg-[#C8F31D] text-sm font-bold text-[#101510] hover:bg-[#D9FF53]"
        >
          <RotateCcw className="mr-2 size-4" />
          {ganhou
            ? "Jogar novamente"
            : "Tentar novamente"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="h-11 w-full rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="mr-2 size-4" />
          Voltar aos desafios
        </Button>
      </div>
    </motion.div>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function DialogJogo({
  id,
  nome,
  valor,
  tipo,
  img,
  time,
}: DialogJogoProps) {
  const [open, setOpen] = React.useState(false)

  const [phase, setPhase] =
    React.useState<GamePhase>("idle")

  const [elapsedMs, setElapsedMs] =
    React.useState(0)

  const [targetMs, setTargetMs] =
    React.useState(time * 1000)

  const [result, setResult] =
    React.useState<GameResult | null>(null)

  const startedAtRef =
    React.useRef<number | null>(null)

  const stoppedRef = React.useRef(false)

  const frameRef =
    React.useRef<number | null>(null)

  const phaseRef =
    React.useRef<GamePhase>("idle")

  const attemptIdRef =
    React.useRef<string | null>(null)

  const speedFactorRef =
    React.useRef(1000)

  // =====================================================
  // CONTROLE DE FASE
  // =====================================================

  const setGamePhase = React.useCallback(
    (value: GamePhase) => {
      phaseRef.current = value
      setPhase(value)
    },
    []
  )

  // =====================================================
  // CANCELAR ANIMAÇÃO
  // =====================================================

  const cancelTimer = React.useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [])

  // =====================================================
  // RESET
  // =====================================================

  const resetVisual = React.useCallback(() => {
    cancelTimer()

    startedAtRef.current = null
    stoppedRef.current = false
    attemptIdRef.current = null
    speedFactorRef.current = 1000

    setElapsedMs(0)
    setResult(null)

    setGamePhase("idle")
  }, [cancelTimer, setGamePhase])

  // =====================================================
  // CARREGAR DESAFIO
  // =====================================================

  const loadPrize = React.useCallback(async () => {
    setGamePhase("loading")

    try {
      const response = await getGame(id)

      if (!response.success) {
        toast.error(response.error)
        setGamePhase("idle")
        return
      }

      setTargetMs(response.prize.targetMs)

      speedFactorRef.current =
        response.prize.speedFactor

      setGamePhase("ready")
    } catch {
      toast.error(
        "Não foi possível carregar o desafio."
      )
      setGamePhase("idle")
    }
  }, [id, setGamePhase])

  React.useEffect(() => {
    if (!open) return

    let cancelled = false

    async function load() {
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

        speedFactorRef.current =
          response.prize.speedFactor

        setGamePhase("ready")
      } catch {
        if (!cancelled) {
          toast.error(
            "Não foi possível carregar o desafio."
          )
          setGamePhase("idle")
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [open, id, setGamePhase])

  // =====================================================
  // CRONÔMETRO
  // =====================================================

  React.useEffect(() => {
    if (phase !== "running") return

    function tick() {
      if (startedAtRef.current === null) return

      const realElapsedMs =
        performance.now() - startedAtRef.current

      const gameElapsedMs =
        (realElapsedMs *
          speedFactorRef.current) /
        1000

      setElapsedMs(gameElapsedMs)

      frameRef.current =
        requestAnimationFrame(tick)
    }

    frameRef.current =
      requestAnimationFrame(tick)

    return cancelTimer
  }, [phase, cancelTimer])

  // =====================================================
  // INICIAR
  // =====================================================

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

      notifyWalletUpdated()

      attemptIdRef.current =
        response.attemptId

      speedFactorRef.current =
        response.speedFactor

      setTargetMs(response.targetMs)
      setResult(null)
      setElapsedMs(0)

      stoppedRef.current = false
      startedAtRef.current =
        performance.now()

      setGamePhase("running")
    } catch {
      toast.error(
        "Não foi possível iniciar a tentativa."
      )
      setGamePhase("ready")
    }
  }, [id, setGamePhase])

  // =====================================================
  // PARAR
  // =====================================================

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

    const realElapsedMs =
      performance.now() - startedAtRef.current

    const finalElapsedMs = Math.round(
      (realElapsedMs *
        speedFactorRef.current) /
        1000
    )

    setElapsedMs(finalElapsedMs)
    setGamePhase("stopping")

    cancelTimer()

    try {
      const response = await stopGame(
        attemptIdRef.current,
        finalElapsedMs
      )

      if (!response.success) {
        toast.error(response.error)
        setGamePhase("error")
        return
      }

      if (response.balance !== null) {
        notifyWalletUpdated()
      }

      setElapsedMs(response.elapsedMs)

      setResult({
        elapsedMs: response.elapsedMs,
        targetMs: response.targetMs,
        status: response.status,
      })

      setGamePhase("finished")
    } catch {
      toast.error(
        "Não foi possível confirmar o resultado."
      )
      setGamePhase("error")
    }
  }, [cancelTimer, setGamePhase])

  // =====================================================
  // ESPAÇO NO DESKTOP
  // =====================================================

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

      const target =
        event.target as HTMLElement | null

      if (
        target?.closest(
          "input, textarea, select, [contenteditable='true']"
        )
      ) {
        return
      }

      if (phaseRef.current !== "running") {
        return
      }

      event.preventDefault()
      void handleStop()
    }

    window.addEventListener(
      "keydown",
      onKeyDown
    )

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      )
    }
  }, [open, handleStop])

  // =====================================================
  // ABRIR / FECHAR
  // =====================================================

  function handleOpenChange(nextOpen: boolean) {
    if (
      !nextOpen &&
      (phaseRef.current === "running" ||
        phaseRef.current === "stopping" ||
        phaseRef.current === "loading" ||
        phaseRef.current === "error")
    ) {
      toast.info(
        "Finalize a tentativa antes de fechar."
      )
      return
    }

    setOpen(nextOpen)

    if (!nextOpen) {
      resetVisual()
    }
  }

  function handleRetry() {
    resetVisual()
    void loadPrize()
  }

  const isRunning = phase === "running"
  const isStopping = phase === "stopping"
  const isFinished = phase === "finished"

  const minTime =
    Math.max(0, targetMs - GAME_CONFIG.toleranceMs)

  const maxTime =
    targetMs + GAME_CONFIG.toleranceMs

  const retornoSimulado =
    valor * GAME_CONFIG.multiplier

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger
        render={
          <Button className="h-11 w-full rounded-xl bg-[#C8F31D] text-sm font-bold text-[#101510] hover:bg-[#D9FF53]">
            <Gamepad2 className="mr-2 size-4" />
            Jogar agora
          </Button>
        }
      />

      <DialogContent
        showCloseButton={
          phase !== "running" &&
          phase !== "stopping" &&
          phase !== "loading" &&
          phase !== "error"
        }
        className="max-h-[95dvh] w-[calc(100%-24px)] max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#101510] p-0 text-white sm:rounded-3xl"
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
              {tipo} · Participação de{" "}
              {formatCurrency(valor)}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {isFinished && result ? (
              <ResultadoJogo
                key="resultado"
                result={result}
                nome={nome}
                valor={valor}
                onRetry={handleRetry}
                onClose={() =>
                  handleOpenChange(false)
                }
              />
            ) : (
              <motion.div
                key="jogo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
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
                      Acerte o tempo dentro da margem.
                    </p>
                  </div>
                </div>

               
                {/* TEMPO-ALVO */}
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
                        Cronômetro
                      </span>
                    </div>

                    <div className="font-mono text-[clamp(2.8rem,12vw,4.5rem)] font-black tracking-[-0.06em] tabular-nums text-[#C8F31D]">
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
                        {phase === "idle" &&
                          "Aguardando desafio"}
                        {phase === "loading" &&
                          "Preparando desafio..."}
                        {phase === "ready" &&
                          "Pronto para começar"}
                        {phase === "running" &&
                          "Cronômetro em andamento"}
                        {phase === "stopping" &&
                          "Registrando resultado..."}
                        {phase === "error" &&
                          "Não foi possível confirmar a tentativa"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTÕES */}
                <div className="mt-5 space-y-3">
                  {phase === "ready" && (
                    <Button
                      type="button"
                      onClick={handleStart}
                      className="h-12 w-full rounded-xl bg-[#C8F31D] text-sm font-bold text-[#101510] hover:bg-[#D9FF53]"
                    >
                      <Gamepad2 className="mr-2 size-4" />
                      Iniciar desafio
                    </Button>
                  )}

                  {phase === "loading" && (
                    <Button
                      type="button"
                      isDisabled
                      className="h-12 w-full rounded-xl bg-[#C8F31D] text-[#101510]"
                    >
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                      Aguarde...
                    </Button>
                  )}

                  {isRunning && (
                    <Button
                      type="button"
                      onClick={handleStop}
                      className="h-14 w-full rounded-xl bg-[#C8F31D] text-base font-black text-[#101510] hover:bg-[#D9FF53]"
                    >
                      <Target className="mr-2 size-5" />
                      PARAR AGORA
                    </Button>
                  )}

                  {isStopping && (
                    <Button
                      type="button"
                      isDisabled
                      className="h-12 w-full rounded-xl bg-white/10 text-white"
                    >
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                      Registrando...
                    </Button>
                  )}

                  {phase === "error" && (
                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-center">
                      <p className="text-sm font-semibold text-amber-300">
                        Resultado não confirmado
                      </p>

                      <p className="mt-2 text-xs text-zinc-400">
                        Sua tentativa pode ter sido registrada.
                        Consulte o histórico antes de jogar novamente.
                      </p>
                    </div>
                  )}

                  {phase === "idle" && (
                    <Button
                      type="button"
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
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 flex items-center justify-center gap-2 border-t border-white/[0.06] pt-4">
            <Wallet className="size-3.5 text-zinc-600" />

           
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}