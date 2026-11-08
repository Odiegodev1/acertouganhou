"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import Image, { type StaticImageData } from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Clock3,
  Gamepad2,
  Play,
  RotateCcw,
  Square,
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



import {
  formatDemoMoney,
} from "@/lib/game/format"
import { getWallet } from "./form/actions/wallet/get-wallet"
import { getGame } from "./form/actions/game/get-game"
import { startGame } from "./form/actions/game/start-game"
import { stopGame } from "./form/actions/game/stop-game"
import { JogoCronometro } from "../jogar/components/jogo-cronometro"
import { JogoResultado } from "../jogar/components/jogo-resultado"
import { DialogDeposito } from "./Dialogdeposito"


interface DialogJogoProps {
  id: string
  nome: string
  valor: number
  tipo: string
  img?: StaticImageData
  time: number
}

type Status =
  | "idle"
  | "starting"
  | "running"
  | "stopping"
  | "won"
  | "lost"

type GameConfig = {
  id: string
  name: string
  value: number
  playCost: number
  targetMs: number
  speedFactor: number
}

export function DialogJogo({
  id,
  nome,
  valor,
  tipo,
  img,
}: DialogJogoProps) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)

  const [status, setStatus] = useState<Status>("idle")
  const [loading, setLoading] = useState(false)

  const [balance, setBalance] = useState(0)
  const [config, setConfig] = useState<GameConfig | null>(null)

  const [elapsed, setElapsed] = useState(0)
  const [officialElapsed, setOfficialElapsed] = useState(0)
  const [attempts, setAttempts] = useState(0)

  const attemptRef = useRef<string | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const speedRef = useRef(1)
  const frameRef = useRef<number | null>(null)
  const statusRef = useRef<Status>("idle")
  const busyRef = useRef(false)
  const spacePressedRef = useRef(false)

  const updateStatus = useCallback((value: Status) => {
    statusRef.current = value
    setStatus(value)
  }, [])

  const cancelTimer = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    startedAtRef.current = null
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)

    try {
      const [walletResult, gameResult] = await Promise.all([
        getWallet(),
        getGame(id),
      ])

      if (!walletResult.success) {
        toast.error(walletResult.error)
        return
      }

      if (!gameResult.success) {
        toast.error(gameResult.error)
        return
      }

      setBalance(walletResult.balance)
      setConfig(gameResult.prize)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (open) {
      void loadData()
    }
  }, [open, loadData])

  const start = useCallback(async () => {
    if (
      busyRef.current ||
      statusRef.current !== "idle" ||
      !config
    ) {
      return
    }

    if (balance < config.playCost) {
      setDepositOpen(true)
      return
    }

    busyRef.current = true
    updateStatus("starting")

    try {
      const result = await startGame(id)

      if (!result.success) {
        updateStatus("idle")

        if (result.code === "INSUFFICIENT_BALANCE") {
          setDepositOpen(true)
          void loadData()
        } else {
          toast.error(result.error)
        }

        return
      }

      attemptRef.current = result.attemptId
      speedRef.current = result.speedFactor / 1000

      setBalance(result.balance)
      setElapsed(0)
      setOfficialElapsed(0)

      // Prévia visual. O tempo oficial vem do backend.
      startedAtRef.current = performance.now()

      updateStatus("running")

      const tick = (now: number) => {
        if (startedAtRef.current === null) return

        const ms =
          (now - startedAtRef.current) * speedRef.current

        setElapsed(ms)

        frameRef.current = requestAnimationFrame(tick)
      }

      frameRef.current = requestAnimationFrame(tick)
    } catch {
      updateStatus("idle")
      toast.error("Erro ao iniciar a partida.")
    } finally {
      busyRef.current = false
    }
  }, [id, config, balance, loadData, updateStatus])

  const stop = useCallback(async () => {
    if (
      busyRef.current ||
      statusRef.current !== "running" ||
      !attemptRef.current
    ) {
      return
    }

    busyRef.current = true
    updateStatus("stopping")

    cancelTimer()

    try {
      const result = await stopGame(attemptRef.current)

      if (!result.success) {
        toast.error(result.error)
        // A tentativa pode continuar RUNNING no banco.
        // Não permita criar outra até reconciliar o estado.
        return
      }

      attemptRef.current = null

      setOfficialElapsed(result.elapsedMs)
      setElapsed(result.elapsedMs)

      setAttempts((prev) => prev + 1)

      updateStatus(
        result.status === "WON" ? "won" : "lost"
      )

      if (result.balance !== null) {
        setBalance(result.balance)
      }

      router.refresh()
    } catch {
      toast.error("Não foi possível confirmar o resultado.")
    } finally {
      busyRef.current = false
    }
  }, [cancelTimer, router, updateStatus])

  const reset = useCallback(() => {
    if (attemptRef.current) return

    cancelTimer()
    setElapsed(0)
    setOfficialElapsed(0)
    updateStatus("idle")
  }, [cancelTimer, updateStatus])

  // Espaço: apenas desktop
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code !== "Space" ||
        event.repeat ||
        spacePressedRef.current
      ) {
        return
      }

      if (!window.matchMedia("(min-width: 768px)").matches) {
        return
      }

      const target = event.target

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLButtonElement ||
        (target instanceof HTMLElement &&
          target.isContentEditable)
      ) {
        return
      }

      if (depositOpen) return

      event.preventDefault()
      spacePressedRef.current = true

      if (statusRef.current === "idle") {
        void start()
      } else if (statusRef.current === "running") {
        void stop()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        spacePressedRef.current = false
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [open, depositOpen, start, stop])

  useEffect(() => {
    return () => cancelTimer()
  }, [cancelTimer])

  const finished = status === "won" || status === "lost"
  const running = status === "running"

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          // Não abandonar uma tentativa em andamento.
          if (
            !next &&
            (attemptRef.current ||
              statusRef.current === "starting" ||
              statusRef.current === "stopping")
          ) {
            toast.error("Encerre a tentativa antes de sair.")
            return
          }

          setOpen(next)
        }}
      >
        <DialogTrigger
          render={
            <Button className="h-10 w-full rounded-xl bg-[#c8f31d] text-xs font-bold text-[#101509] hover:bg-[#d9ff53]">
              <Gamepad2 className="mr-2 size-4" />
              Jogar agora
            </Button>
          }
        />

        <DialogContent
          showCloseButton={false}
          className="flex max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-[460px] flex-col gap-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#101510] p-0 text-white"
        >
          <DialogHeader className="border-b border-white/10 px-5 py-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#c8f31d]/10">
                  <Clock3 className="size-5 text-[#c8f31d]" />
                </div>

                <div>
                  <DialogTitle className="text-base font-bold text-white">
                    Desafio do tempo
                  </DialogTitle>

                  <DialogDescription className="text-xs text-zinc-500">
                    Pare no tempo exato para vencer
                  </DialogDescription>
                </div>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={() => {
                  if (attemptRef.current) {
                    toast.error("Encerre a tentativa primeiro.")
                    return
                  }

                  setOpen(false)
                }}
                className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
          </DialogHeader>

          <div className="min-h-0 space-y-4 overflow-y-auto px-5 py-5">
            {/* PRÊMIO */}
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#181f18] p-3">
              <div className="flex size-14 items-center justify-center overflow-hidden rounded-xl bg-[#c8f31d]/10">
                {img ? (
                  <Image
                    src={img}
                    alt={nome}
                    width={56}
                    height={56}
                    className="size-full object-cover"
                  />
                ) : (
                  <Trophy className="size-6 text-[#c8f31d]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase text-zinc-500">
                  Prêmio fictício
                </p>

                <h3 className="truncate text-sm font-semibold">
                  {config?.name ?? nome}
                </h3>

                <p className="mt-1 text-lg font-bold text-[#c8f31d]">
                  {formatDemoMoney(
                    config?.value ?? Math.round(valor * 100)
                  )}
                </p>
              </div>

              <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-400">
                {tipo}
              </span>
            </div>

            {/* SALDO */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Wallet className="size-4" />
                Saldo demo
              </div>

              <span className="font-semibold text-[#c8f31d]">
                {formatDemoMoney(balance)}
              </span>
            </div>

            {config && (
              <JogoCronometro
                elapsed={elapsed}
                targetMs={config.targetMs}
                running={running}
              />
            )}

            {finished && config && (
              <JogoResultado
                won={status === "won"}
                elapsedMs={officialElapsed}
                targetMs={config.targetMs}
              />
            )}

            {/* CONTROLES */}
            {status === "idle" && (
              <Button
                onClick={() => void start()}
                isDisabled={loading || !config}
                className="h-14 w-full rounded-xl bg-[#c8f31d] font-bold text-black hover:bg-[#d9ff53]"
              >
                <Play className="mr-2 size-4" />

                {loading
                  ? "Carregando..."
                  : balance < (config?.playCost ?? 0)
                    ? "Adicionar saldo demo"
                    : `Jogar • ${formatDemoMoney(config?.playCost ?? 0)}`}
              </Button>
            )}

            {status === "starting" && (
              <Button isDisabled className="h-14 w-full">
                Iniciando partida...
              </Button>
            )}

            {running && (
              <Button
                onClick={() => void stop()}
                className="h-14 w-full rounded-xl bg-red-500 font-bold text-white hover:bg-red-600"
              >
                <Square className="mr-2 size-4" />
                PARAR CRONÔMETRO
              </Button>
            )}

            {status === "stopping" && (
              <Button isDisabled className="h-14 w-full">
                Confirmando resultado...
              </Button>
            )}

            {finished && (
              <Button
                onClick={reset}
                className="h-14 w-full rounded-xl bg-[#c8f31d] font-bold text-black hover:bg-[#d9ff53]"
              >
                <RotateCcw className="mr-2 size-4" />
                Tentar novamente
              </Button>
            )}

            <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-zinc-500">
              <span>Tentativas nesta sessão</span>

              <span className="font-mono text-sm font-semibold text-white">
                {String(attempts).padStart(2, "0")}
              </span>
            </div>

            <p className="text-center text-[10px] text-zinc-600">
              Demonstração · Sem dinheiro ou prêmios reais
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <DialogDeposito
        open={depositOpen}
        onOpenChange={setDepositOpen}
        onSuccess={() => {
          setDepositOpen(false)
          void loadData()
        }}
      />
    </>
  )
}