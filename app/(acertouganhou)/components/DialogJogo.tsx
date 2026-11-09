"use client"
import * as React from "react"
import Image, { type StaticImageData } from "next/image"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"
import {
  Clock3,
  Gamepad2,
  LoaderCircle,
  RotateCcw,
  Target,
  Trophy,
  Wallet,
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
import { ResultadoJogo } from "./ResultadoJogo"
import { getGame } from "./form/actions/game/get-game"
import { startGame } from "./form/actions/game/start-game"
import { stopGame } from "./form/actions/game/stop-game"
import { getGameClock } from "./form/actions/game/get-game-clock"
import {
  createLatencyProbe,
  finishLatencyProbe,
} from "./form/actions/game/latency-probe"
import { expireGame } from "@/lib/game/expire-game"
import { notifyGameWalletUpdated } from "@/lib/game/wallet-events"
import { GAME_CONFIG } from "@/lib/game/config"
// ======================================================
// TIPOS
// ======================================================
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
  | "starting"
  | "running"
  | "stopping"
  | "finished"
  | "error"
type FinalStatus = "WON" | "LOST"
interface GameResult {
  status: FinalStatus
  elapsedMs: number
  targetMs: number
  latencyCompensationMs?: number
  rawElapsedMs?: number
}
interface ClockAnchor {
  elapsedMs: number
  performanceAt: number
  speedFactor: number
}
// ======================================================
// HELPERS
// ======================================================
function formatTime(ms: number) {
  return (Math.max(0, ms) / 1000).toLocaleString("pt-BR", {
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
function isDesktop() {
  if (typeof window === "undefined") {
    return false
  }
  return window.matchMedia(
    "(hover: hover) and (pointer: fine) and (min-width: 768px)"
  ).matches
}
function isFinalStatus(
status: string
): status is FinalStatus {
  return status === "WON" || status === "LOST"
}
// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================
export function DialogJogo({
id,
nome,
valor,
tipo,
img,
time,
}: DialogJogoProps) {
// ====================================================
// STATES
// ====================================================
  const [open, setOpen] = React.useState(false)
  const [phase, setPhase] =
    React.useState<GamePhase>("idle")
  const [elapsedMs, setElapsedMs] =
    React.useState(0)
  const [targetMs, setTargetMs] =
    React.useState(time * 1000)
  const [result, setResult] =
    React.useState<GameResult | null>(null)
  const [frozenTime, setFrozenTime] =
    React.useState<number | null>(null)
  const [errorMessage, setErrorMessage] =
    React.useState("")
// ====================================================
// REFS
// ====================================================
  const phaseRef = React.useRef<GamePhase>("idle")
  const attemptIdRef =
    React.useRef<string | null>(null)
  const clockAnchorRef =
    React.useRef<ClockAnchor>({
      elapsedMs: 0,
      performanceAt: 0,
      speedFactor: 1000,
    })
  const frameRef =
    React.useRef<number | null>(null)
  const stoppingRef = React.useRef(false)
  const finishingRef = React.useRef(false)
  const requestVersionRef = React.useRef(0)
// ====================================================
// ATUALIZAR FASE
// ====================================================
  const setGamePhase = React.useCallback(
    (value: GamePhase) => {
      phaseRef.current = value
      setPhase(value)
    },
    []
  )
// ====================================================
// CANCELAR ANIMAÇÃO
// ====================================================
  const cancelTimer = React.useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [])
// ====================================================
// TEMPO ESTIMADO
// ====================================================
  const getEstimatedElapsed = React.useCallback(
    (at = performance.now()) => {
      const anchor = clockAnchorRef.current
      const delta = Math.max(
        0,
        at - anchor.performanceAt
      )
      return Math.max(
        0,
        anchor.elapsedMs +
          (delta * anchor.speedFactor) / 1000
      )
    },
    []
  )
// ====================================================
// RESET
// ====================================================
  const resetVisual = React.useCallback(() => {
    requestVersionRef.current += 1
    cancelTimer()
    attemptIdRef.current = null
    stoppingRef.current = false
    finishingRef.current = false
    clockAnchorRef.current = {
      elapsedMs: 0,
      performanceAt: 0,
      speedFactor: 1000,
    }
    setElapsedMs(0)
    setFrozenTime(null)
    setResult(null)
    setErrorMessage("")
    setGamePhase("idle")
  }, [cancelTimer, setGamePhase])
// ====================================================
// RESULTADO OFICIAL
// ====================================================
  const applyOfficialResult = React.useCallback(
    (
      status: FinalStatus,
      officialElapsedMs: number,
      officialTargetMs: number,
      extras?: {
        latencyCompensationMs?: number
        rawElapsedMs?: number
      }
    ) => {
      cancelTimer()
      setResult({
        status,
        elapsedMs: officialElapsedMs,
        targetMs: officialTargetMs,
        latencyCompensationMs:
          extras?.latencyCompensationMs,
        rawElapsedMs:
          extras?.rawElapsedMs,
      })
      stoppingRef.current = false
      finishingRef.current = false
      setGamePhase("finished")
      notifyGameWalletUpdated()
    },
    [cancelTimer, setGamePhase]
  )
// ====================================================
// CARREGAR PRÊMIO
// ====================================================
  const loadPrize = React.useCallback(async () => {
    const version =
      ++requestVersionRef.current
    setGamePhase("loading")
    setErrorMessage("")
    try {
      const response = await getGame(id)
      if (
        version !== requestVersionRef.current
      ) {
        return
      }
      if (!response.success) {
        setErrorMessage(
          response.error ||
            "Desafio indisponível."
        )
        setGamePhase("idle")
        return
      }
      setTargetMs(
        response.prize.targetMs
      )
      clockAnchorRef.current.speedFactor =
        response.prize.speedFactor
      setGamePhase("ready")
    } catch (error) {
      console.error("[GET_GAME]", error)
      if (
        version !== requestVersionRef.current
      ) {
        return
      }
      setErrorMessage(
        "Não foi possível carregar o desafio."
      )
      setGamePhase("idle")
    }
  }, [id, setGamePhase])
// ====================================================
// ABRIR MODAL
// ====================================================
  React.useEffect(() => {
    if (!open) return
    void loadPrize()
    return () => {
      requestVersionRef.current += 1
      cancelTimer()
    }
  }, [
    open,
    loadPrize,
    cancelTimer,
  ])
// ====================================================
// RECUPERAR RESULTADO
// ====================================================
  const recoverResult = React.useCallback(
    async (attemptId: string) => {
      try {
        const response =
          await getGameClock(attemptId)
        if (
          attemptIdRef.current !== attemptId
        ) {
          return
        }
        if (!response.success) {
          setErrorMessage(response.error)
          setGamePhase("error")
          return
        }
        if (
          isFinalStatus(response.status)
        ) {
          applyOfficialResult(
            response.status,
            response.elapsedMs,
            response.targetMs
          )
          return
        }
        const expiration =
          await expireGame(attemptId)
        if (
          attemptIdRef.current !== attemptId
        ) {
          return
        }
        if (!expiration.success) {
          setErrorMessage(
            expiration.error
          )
          setGamePhase("error")
          return
        }
        if (
          isFinalStatus(expiration.status)
        ) {
          setFrozenTime(null)
          setElapsedMs(
            expiration.elapsedMs
          )
          applyOfficialResult(
            expiration.status,
            expiration.elapsedMs,
            expiration.targetMs
          )
          return
        }
        setErrorMessage(
          "A tentativa ainda está ativa. Aguarde ou consulte novamente."
        )
        setGamePhase("error")
      } catch (error) {
        console.error(
          "[RECOVER_GAME]",
          error
        )
        if (
          attemptIdRef.current !== attemptId
        ) {
          return
        }
        setErrorMessage(
          "Falha ao consultar o resultado."
        )
        setGamePhase("error")
      }
    },
    [
      applyOfficialResult,
      setGamePhase,
    ]
  )
// ====================================================
// CRONÔMETRO VISUAL
// ====================================================
  React.useEffect(() => {
    if (phase !== "running") {
      return
    }
    function tick() {
      if (
        phaseRef.current !== "running"
      ) {
        return
      }
      setElapsedMs(
        getEstimatedElapsed()
      )
      frameRef.current =
        requestAnimationFrame(tick)
    }
    frameRef.current =
      requestAnimationFrame(tick)
    return cancelTimer
  }, [
    phase,
    getEstimatedElapsed,
    cancelTimer,
  ])
// ====================================================
// SINCRONIZAÇÃO COM SERVIDOR
// ====================================================
  React.useEffect(() => {
    if (phase !== "running") {
      return
    }
    const attemptId =
      attemptIdRef.current
    if (!attemptId) {
      return
    }
    let cancelled = false
    let inFlight = false
    async function synchronize() {
      if (
        cancelled ||
        inFlight ||
        finishingRef.current ||
        phaseRef.current !== "running"
      ) {
        return
      }
      inFlight = true
      try {
        const before =
          performance.now()
        const response =
          await getGameClock(attemptId!)
        const after =
          performance.now()
        if (
          cancelled ||
          finishingRef.current ||
          phaseRef.current !== "running" ||
          attemptIdRef.current !== attemptId
        ) {
          return
        }
        if (!response.success) {
          return
        }
        if (
          isFinalStatus(response.status)
        ) {
          applyOfficialResult(
            response.status,
            response.elapsedMs,
            response.targetMs
          )
          return
        }
        if (
          response.status !== "RUNNING"
        ) {
          return
        }
        const roundTripMs =
          after - before
        const speedFactor =
          clockAnchorRef.current
            .speedFactor
// Estimativa visual de meia viagem.
        const estimatedAtReceipt =
          response.elapsedMs +
          ((roundTripMs / 2) *
            speedFactor) /
            1000
        clockAnchorRef.current = {
          elapsedMs:
            estimatedAtReceipt,
          performanceAt: after,
          speedFactor,
        }
      } catch (error) {
        console.error(
          "[CLOCK_SYNC]",
          error
        )
      } finally {
        inFlight = false
      }
    }
    void synchronize()
    const interval =
      window.setInterval(() => {
        void synchronize()
      }, 1500)
    return () => {
      cancelled = true
      window.clearInterval(
        interval
      )
    }
  }, [
    phase,
    applyOfficialResult,
  ])
// ====================================================
// MEDIÇÃO DE LATÊNCIA
// ====================================================
  React.useEffect(() => {
    if (phase !== "running") {
      return
    }
    const attemptId =
      attemptIdRef.current
    if (!attemptId) {
      return
    }
    let cancelled = false
    let measuring = false
    async function measureLatency() {
      if (
        cancelled ||
        measuring ||
        finishingRef.current ||
        phaseRef.current !== "running"
      ) {
        return
      }
      measuring = true
      try {
        const probe =
          await createLatencyProbe(
            attemptId!
          )
        if (
          !probe.success ||
          cancelled ||
          phaseRef.current !== "running" ||
          finishingRef.current
        ) {
          return
        }
        await finishLatencyProbe(
          attemptId!,
          probe.probeId
        )
      } catch (error) {
        console.error(
          "[LATENCY_PROBE]",
          error
        )
      } finally {
        measuring = false
      }
    }
    void measureLatency()
    const interval =
      window.setInterval(() => {
        void measureLatency()
      }, 1500)
    return () => {
      cancelled = true
      window.clearInterval(
        interval
      )
    }
  }, [phase])
// ====================================================
// DERROTA AUTOMÁTICA
// ====================================================
  React.useEffect(() => {
    if (phase !== "running") {
      return
    }
    const attemptId =
      attemptIdRef.current
    if (!attemptId) {
      return
    }
    let cancelled = false
    let checking = false
    const compensationWindowMs =
      GAME_CONFIG.maxLatencyCompensationMs *
      (
        clockAnchorRef.current
          .speedFactor / 1000
      )
    const maxAllowedMs =
      targetMs +
      GAME_CONFIG.toleranceMs +
      compensationWindowMs
    async function checkExpiration() {
      if (
        cancelled ||
        checking ||
        finishingRef.current ||
        phaseRef.current !== "running"
      ) {
        return
      }
      if (
        getEstimatedElapsed() <=
        maxAllowedMs
      ) {
        return
      }
      checking = true
      finishingRef.current = true
      cancelTimer()
      setGamePhase("stopping")
      try {
        const response =
          await expireGame(
            attemptId!
          )
        if (
          cancelled ||
          attemptIdRef.current !== attemptId
        ) {
          return
        }
        if (!response.success) {
          setErrorMessage(
            response.error
          )
          setGamePhase("error")
          return
        }
        if (
          isFinalStatus(
            response.status
          )
        ) {
          setFrozenTime(null)
          setElapsedMs(
            response.elapsedMs
          )
          applyOfficialResult(
            response.status,
            response.elapsedMs,
            response.targetMs
          )
          return
        }
// Servidor ainda considera RUNNING.
        clockAnchorRef.current = {
          elapsedMs:
            response.elapsedMs,
          performanceAt:
            performance.now(),
          speedFactor:
            clockAnchorRef.current
              .speedFactor,
        }
        setElapsedMs(
          response.elapsedMs
        )
        finishingRef.current = false
        setGamePhase("running")
      } catch (error) {
        console.error(
          "[EXPIRE_GAME]",
          error
        )
        if (
          attemptIdRef.current !== attemptId
        ) {
          return
        }
        setErrorMessage(
          "Não foi possível confirmar o encerramento automático."
        )
        setGamePhase("error")
      } finally {
        checking = false
      }
    }
    const interval =
      window.setInterval(() => {
        void checkExpiration()
      }, 100)
    return () => {
      cancelled = true
      window.clearInterval(
        interval
      )
    }
  }, [
    phase,
    targetMs,
    getEstimatedElapsed,
    cancelTimer,
    applyOfficialResult,
    setGamePhase,
  ])
// ====================================================
// INICIAR PARTIDA
// ====================================================
  const handleStart =
    React.useCallback(async () => {
      if (
        phaseRef.current !== "ready"
      ) {
        return
      }
      setGamePhase("starting")
      setErrorMessage("")
      try {
        const response =
          await startGame(id)
        if (!response.success) {
          toast.error(
            response.error
          )
          if (
            response.code ===
            "ACTIVE_GAME"
          ) {
            setErrorMessage(
              "Você já possui uma tentativa em andamento."
            )
            setGamePhase("error")
            return
          }
          setGamePhase("ready")
          return
        }
        attemptIdRef.current =
          response.attemptId
        stoppingRef.current = false
        finishingRef.current = false
        setTargetMs(
          response.targetMs
        )
        setResult(null)
        setFrozenTime(null)
        setErrorMessage("")
        notifyGameWalletUpdated()
        const serverNow =
          Date.parse(
            response.serverNow
          )
        const startedAt =
          Date.parse(
            response.startedAt
          )
        const initialElapsedMs =
          Math.max(
            0,
            (
              (serverNow - startedAt) *
              response.speedFactor
            ) / 1000
          )
        clockAnchorRef.current = {
          elapsedMs:
            initialElapsedMs,
          performanceAt:
            performance.now(),
          speedFactor:
            response.speedFactor,
        }
        setElapsedMs(
          initialElapsedMs
        )
        setGamePhase("running")
      } catch (error) {
        console.error(
          "[START_GAME]",
          error
        )
        setErrorMessage(
          "Não foi possível confirmar o início. Consulte suas tentativas antes de jogar novamente."
        )
        setGamePhase("error")
      }
    }, [
      id,
      setGamePhase,
    ])
// ====================================================
// PARAR PARTIDA
// ====================================================
  const handleStop =
    React.useCallback(async () => {
      if (
        phaseRef.current !== "running" ||
        stoppingRef.current ||
        finishingRef.current
      ) {
        return
      }
      const attemptId =
        attemptIdRef.current
      if (!attemptId) {
        return
      }
// Captura o instante do clique.
      const clickedAt =
        performance.now()
// Congela imediatamente o visor.
      const frozenMs =
        Math.round(
          getEstimatedElapsed(
            clickedAt
          )
        )
      setFrozenTime(
        frozenMs
      )
      setElapsedMs(
        frozenMs
      )
      stoppingRef.current = true
      finishingRef.current = true
      cancelTimer()
      setGamePhase("stopping")
      try {
// Backend aplica a compensação.
        const response =
          await stopGame(
            attemptId
          )
        if (
          attemptIdRef.current !== attemptId
        ) {
          return
        }
        if (!response.success) {
          setErrorMessage(
            response.error
          )
          setGamePhase("error")
          return
        }
        applyOfficialResult(
          response.status,
          response.elapsedMs,
          response.targetMs,
          {
            latencyCompensationMs:
              response.latencyCompensationMs,
            rawElapsedMs:
              response.rawElapsedMs,
          }
        )
      } catch (error) {
        console.error(
          "[STOP_GAME]",
          error
        )
        if (
          attemptIdRef.current !== attemptId
        ) {
          return
        }
        setErrorMessage(
          "Não foi possível confirmar o resultado. Consulte novamente."
        )
        setGamePhase("error")
      }
    }, [
      getEstimatedElapsed,
      cancelTimer,
      applyOfficialResult,
      setGamePhase,
    ])
// ====================================================
// TECLA ESPAÇO — DESKTOP
// ====================================================
  React.useEffect(() => {
    if (!open) {
      return
    }
    function onKeyDown(
event: KeyboardEvent
    ) {
      if (!isDesktop()) {
        return
      }
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
      if (
        phaseRef.current !== "running"
      ) {
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
  }, [
    open,
    handleStop,
  ])
// ====================================================
// ABRIR / FECHAR MODAL
// ====================================================
  function handleOpenChange(
nextOpen: boolean
  ) {
    if (!nextOpen) {
      if (
        phaseRef.current === "starting" ||
        phaseRef.current === "running" ||
        phaseRef.current === "stopping"
      ) {
        toast.info(
          "Finalize a tentativa antes de fechar."
        )
        return
      }
      if (
        phaseRef.current === "error" &&
        attemptIdRef.current
      ) {
        toast.info(
          "Consulte o resultado antes de fechar."
        )
        return
      }
    }
    setOpen(nextOpen)
    if (!nextOpen) {
      resetVisual()
    }
  }
// ====================================================
// JOGAR NOVAMENTE
// ====================================================
  function handleRetry() {
    resetVisual()
    void loadPrize()
  }
// ====================================================
// VALORES
// ====================================================
  const isRunning =
    phase === "running"
  const minTime =
    Math.max(
      0,
      targetMs -
        GAME_CONFIG.toleranceMs
    )
  const maxTime =
    targetMs +
    GAME_CONFIG.toleranceMs
  const displayMs =
    frozenTime ?? elapsedMs
  const isBusy =
    phase === "starting" ||
    phase === "running" ||
    phase === "stopping"
  const canClose =
    !isBusy &&
    !(
      phase === "error" &&
      attemptIdRef.current !== null
    )
// ====================================================
// RENDER
// ====================================================
  return (
    <Dialog
open={open}
onOpenChange={handleOpenChange}
    >
      <DialogTrigger
render={
          <Button className="h-11 w-full rounded-xl bg-[#C8F31D] font-bold text-[#101510] hover:bg-[#D9FF53]">
            <Gamepad2 className="mr-2 size-4" />
            Jogar agora
          </Button>
        }
      />
      <DialogContent
showCloseButton={canClose}
className="max-h-[95dvh] w-[calc(100%-24px)] max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#101510] p-0 text-white sm:rounded-3xl"
      >
        <div className="p-5 sm:p-6">
          {/* HEADER */}
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
            {phase === "finished" && result ? (
              <ResultadoJogo
key="resultado"
ganhou={
                  result.status === "WON"
                }
premio={nome}
tempoAlvo={
                  result.targetMs
                }
tempoJogador={
                  frozenTime ??
                  result.elapsedMs
                }
tempoOficial={
                  result.elapsedMs
                }
compensacaoLatencia={
                  result.latencyCompensationMs
                }
onTentarNovamente={
                  handleRetry
                }
onVoltar={() =>
                  handleOpenChange(false)
                }
              />
            ) : (
              <motion.div
key="jogo"
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
              >
                {/* DESAFIO */}
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
                {/* TEMPO ALVO */}
                <div className="mt-5 flex items-center justify-between rounded-xl border border-[#C8F31D]/15 bg-[#C8F31D]/[0.05] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-[#C8F31D]" />
                    <span className="text-xs text-zinc-400">
                      Tempo-alvo
                    </span>
                  </div>
                  <span className="font-mono text-lg font-bold text-[#C8F31D]">
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
                        {frozenTime !== null
                          ? "Tempo congelado"
                          : "Cronômetro"}
                      </span>
                    </div>
                    <div className="font-mono text-[clamp(2.8rem,12vw,4.5rem)] font-black tracking-[-0.06em] tabular-nums text-[#C8F31D]">
                      {formatTime(displayMs)}
                      <span className="ml-1 text-lg text-zinc-500">
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
                        {phase === "starting" &&
                          "Iniciando no servidor..."}
                        {phase === "running" &&
                          "Cronômetro em andamento"}
                        {phase === "stopping" &&
                          "Confirmando resultado..."}
                        {phase === "error" &&
                          "Resultado pendente"}
                      </span>
                    </div>
                    {phase === "stopping" &&
                      frozenTime !== null && (
                        <p className="mt-3 text-xs font-medium text-[#C8F31D]">
                          Você parou em{" "}
                          {formatTime(frozenTime)}s
                        </p>
                      )}
                  </div>
                </div>
                {/* INTERVALO */}
                <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-500">
                  <span>
                    Margem permitida
                  </span>
                  <span className="font-mono text-zinc-300">
                    {formatTime(minTime)}s –{" "}
                    {formatTime(maxTime)}s
                  </span>
                </div>
                {/* AÇÕES */}
                <div className="mt-5 space-y-3">
                  {phase === "ready" && (
                    <Button
type="button"
onClick={handleStart}
className="h-12 w-full rounded-xl bg-[#C8F31D] font-bold text-[#101510] hover:bg-[#D9FF53]"
                    >
                      <Gamepad2 className="mr-2 size-4" />
                      Iniciar desafio
                    </Button>
                  )}
                  {(
                    phase === "loading" ||
                    phase === "starting"
                  ) && (
                    <Button
type="button"
isDisabled
className="h-12 w-full rounded-xl bg-white/10 text-white"
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
                  {phase === "stopping" && (
                    <Button
type="button"
isDisabled
className="h-12 w-full rounded-xl bg-white/10 text-white"
                    >
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                      Confirmando resultado...
                    </Button>
                  )}
                  {phase === "error" && (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-center">
                        <p className="text-sm font-semibold text-amber-300">
                          Resultado não confirmado
                        </p>
                        <p className="mt-2 text-xs text-zinc-400">
                          {errorMessage}
                        </p>
                      </div>
                      {attemptIdRef.current ? (
                        <Button
type="button"
onClick={() => {
                            const attemptId =
                              attemptIdRef.current
                            if (!attemptId) {
                              return
                            }
                            setGamePhase("stopping")
                            void recoverResult(
                              attemptId
                            )
                          }}
className="h-12 w-full rounded-xl bg-[#C8F31D] font-bold text-[#101510] hover:bg-[#D9FF53]"
                        >
                          <RotateCcw className="mr-2 size-4" />
                          Consultar resultado
                        </Button>
                      ) : (
                        <Button
type="button"
onClick={loadPrize}
className="h-12 w-full rounded-xl bg-[#C8F31D] font-bold text-[#101510] hover:bg-[#D9FF53]"
                        >
                          <RotateCcw className="mr-2 size-4" />
                          Tentar carregar novamente
                        </Button>
                      )}
                    </div>
                  )}
                  {phase === "idle" && (
                    <Button
type="button"
isDisabled
className="h-12 w-full rounded-xl bg-white/10 text-zinc-400"
                    >
                      {errorMessage ||
                        "Desafio indisponível"}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}