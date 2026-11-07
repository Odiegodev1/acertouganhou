"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import {
  ArrowRight,
  Check,
  Clock3,
  Gamepad2,
  Keyboard,
  Play,
  RotateCcw,
  Square,
  Target,
  Trophy,
  X,
} from "lucide-react";

interface DialogJogoProps {
  id: string;
  nome: string;
  valor: number;
  tipo: string;
  img?: StaticImageData;
  time: number;
}

type GameStatus = "idle" | "running" | "won" | "lost";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

function formatTime(milliseconds: number) {
  const total = Math.max(0, Math.floor(milliseconds));

  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const ms = total % 1000;

  return {
    main:
      minutes > 0
        ? `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        : String(seconds).padStart(2, "0"),
    ms: String(ms).padStart(3, "0"),
  };
}

export function DialogJogo({
  id,
  nome,
  valor,
  tipo,
  img,
  time,
}: DialogJogoProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const statusRef = useRef<GameStatus>("idle");

  // Evita que segurar Espaço dispare mais de uma ação.
  const spacePressedRef = useRef(false);

  const targetMs = Math.max(1, Math.round(time * 1000));

  const display = formatTime(elapsed);
  const targetDisplay = formatTime(targetMs);

  const isRunning = status === "running";
  const isFinished = status === "won" || status === "lost";

  const difference = Math.abs(elapsed - targetMs);
  const progress = Math.min((elapsed / targetMs) * 100, 100);

  const updateStatus = useCallback((value: GameStatus) => {
    statusRef.current = value;
    setStatus(value);
  }, []);

  const cancelTimer = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    startRef.current = null;
  }, []);

  const resetGame = useCallback(() => {
    cancelTimer();
    setElapsed(0);
    updateStatus("idle");
  }, [cancelTimer, updateStatus]);

  const startGame = useCallback(() => {
    if (statusRef.current !== "idle") return;

    cancelTimer();
    setElapsed(0);
    updateStatus("running");

    startRef.current = performance.now();

    const tick = (now: number) => {
      if (startRef.current === null) return;

      setElapsed(now - startRef.current);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [cancelTimer, updateStatus]);

  const stopGame = useCallback(() => {
    if (
      statusRef.current !== "running" ||
      startRef.current === null
    ) {
      return;
    }

    const finalElapsed = performance.now() - startRef.current;

    cancelTimer();
    setElapsed(finalElapsed);
    setAttempts((prev) => prev + 1);

    // Regra demonstrativa: acertar o milissegundo exibido.
    const won = Math.floor(finalElapsed) === targetMs;

    updateStatus(won ? "won" : "lost");
  }, [cancelTimer, targetMs, updateStatus]);

  // CONTROLE PELO TECLADO
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;

      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();

      if (event.repeat || spacePressedRef.current) return;

      spacePressedRef.current = true;

      if (statusRef.current === "idle") {
        startGame();
        return;
      }

      if (statusRef.current === "running") {
        stopGame();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        spacePressedRef.current = false;
      }
    };

    const handleBlur = () => {
      spacePressedRef.current = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [open, startGame, stopGame]);

  useEffect(() => {
    return () => cancelTimer();
  }, [cancelTimer]);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      resetGame();
      spacePressedRef.current = false;
    }

    setOpen(value);
  };

  const statusLabel = {
    idle: "Pronto para começar",
    running: "Cronômetro em andamento",
    won: "Tempo atingido",
    lost: "Tentativa encerrada",
  }[status];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            className="
              h-10 w-full rounded-xl
              bg-[#c8f31d] px-4
              text-xs font-bold text-[#101509]
              transition-colors hover:bg-[#d9ff53]
            "
          >
            <Gamepad2 className="mr-2 size-4" />
            Jogar agora
          </Button>
        }
      />

      <DialogContent
        showCloseButton={false}
        className="
          flex max-h-[calc(100dvh-24px)]
          w-[calc(100%-24px)] max-w-[460px]
          flex-col gap-0 overflow-hidden
          rounded-[22px] border border-white/10
          bg-[#101510] p-0 text-white
          shadow-2xl
          sm:rounded-[24px]
        "
      >
        {/* CABEÇALHO */}
        <DialogHeader className="shrink-0 border-b border-white/[0.07] px-4 py-4 text-left sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#c8f31d]/10">
                <Clock3 className="size-5 text-[#c8f31d]" />
              </div>

              <div className="min-w-0">
                <DialogTitle className="text-[15px] font-bold tracking-tight text-white">
                  Desafio do tempo
                </DialogTitle>

                <DialogDescription className="mt-0.5 text-xs text-zinc-500">
                  Pare no tempo exato para vencer
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              aria-label="Fechar"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <X className="size-[18px]" />
            </button>
          </div>
        </DialogHeader>

        {/* CONTEÚDO */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          {/* PRÊMIO */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#181f18] p-3.5">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#c8f31d]/10">
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Prêmio em disputa
              </p>

              <h3 className="mt-1 truncate text-sm font-semibold text-zinc-200">
                {nome}
              </h3>

              <p className="mt-1 text-xl font-extrabold tracking-tight text-[#c8f31d]">
                {formatMoney(valor)}
              </p>
            </div>

            <span className="self-start rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium text-zinc-400">
              {tipo}
            </span>
          </div>

          {/* OBJETIVO */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#c8f31d]/15 bg-[#c8f31d]/[0.045] px-4 py-3">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-[#c8f31d]" />

              <span className="text-xs font-medium text-zinc-300">
                Seu objetivo
              </span>
            </div>

            <div className="font-mono text-lg font-bold tabular-nums text-[#c8f31d]">
              {targetDisplay.main}.{targetDisplay.ms}
              <span className="ml-1 text-xs font-normal text-zinc-500">
                s
              </span>
            </div>
          </div>

          {/* CRONÔMETRO */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0e0b] px-3 py-5 text-center sm:px-5 sm:py-7">
            {/* STATUS */}
            <div className="mb-6 flex items-center justify-center gap-2">
              <span
                className={`size-1.5 rounded-full ${
                  isRunning
                    ? "animate-pulse bg-[#c8f31d]"
                    : status === "won"
                      ? "bg-[#c8f31d]"
                      : status === "lost"
                        ? "bg-red-400"
                        : "bg-zinc-600"
                }`}
              />

              <span className="text-[11px] font-medium text-zinc-500">
                {statusLabel}
              </span>
            </div>

            {/* NÚMEROS */}
            <div
              role="timer"
              aria-label={`Tempo decorrido: ${display.main} segundos e ${display.ms} milésimos`}
              className={`
                flex items-baseline justify-center
                font-mono font-bold tabular-nums
                tracking-[-0.065em]
                ${
                  status === "won"
                    ? "text-[#c8f31d]"
                    : status === "lost"
                      ? "text-red-400"
                      : "text-white"
                }
              `}
            >
              <span className="text-[clamp(3.25rem,15vw,5rem)] leading-none">
                {display.main}
              </span>

              <span className="text-[clamp(2.5rem,10vw,3.75rem)] leading-none text-zinc-600">
                .
              </span>

              <span className="text-[clamp(2.5rem,10vw,3.75rem)] leading-none">
                {display.ms}
              </span>
            </div>

            <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">
              Segundos · Milésimos
            </p>

            {/* INSTRUÇÃO DESKTOP */}
            <div className="mt-6 hidden items-center justify-center gap-2 md:flex">
              <Keyboard className="size-4 text-zinc-500" />

              <kbd className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-1.5 font-mono text-[11px] font-semibold text-zinc-200">
                ESPAÇO
              </kbd>

              <span className="text-xs text-zinc-500">
                {status === "idle"
                  ? "para iniciar"
                  : isRunning
                    ? "para parar"
                    : "tentativa finalizada"}
              </span>
            </div>

            {/* INSTRUÇÃO MOBILE */}
            <p className="mt-6 text-xs text-zinc-500 md:hidden">
              {status === "idle"
                ? "Toque em iniciar para começar"
                : isRunning
                  ? "Toque em parar no momento certo"
                  : "Confira o resultado abaixo"}
            </p>

            {/* PROGRESSO */}
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-[10px] text-zinc-600">
                <span>Início</span>
                <span>Tempo alvo: {time}s</span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className={`h-full rounded-full ${
                    status === "lost"
                      ? "bg-red-400"
                      : "bg-[#c8f31d]"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* RESULTADO */}
          {isFinished && (
            <div
              className={`rounded-xl border p-4 ${
                status === "won"
                  ? "border-[#c8f31d]/20 bg-[#c8f31d]/[0.06]"
                  : "border-red-400/15 bg-red-400/[0.04]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    status === "won"
                      ? "bg-[#c8f31d]/10 text-[#c8f31d]"
                      : "bg-red-400/10 text-red-400"
                  }`}
                >
                  {status === "won" ? (
                    <Check className="size-5" />
                  ) : (
                    <X className="size-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white">
                    {status === "won"
                      ? "Você acertou!"
                      : "Não foi dessa vez"}
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    {status === "won"
                      ? "Você parou no tempo exato do desafio."
                      : elapsed < targetMs
                        ? "Você parou antes do tempo determinado."
                        : "Você ultrapassou o tempo determinado."}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div>
                      <p className="text-[10px] text-zinc-500">
                        Seu tempo
                      </p>

                      <p className="mt-0.5 font-mono text-sm font-semibold text-white">
                        {display.main}.{display.ms}s
                      </p>
                    </div>

                    <div className="h-7 w-px bg-white/10" />

                    <div>
                      <p className="text-[10px] text-zinc-500">
                        Diferença
                      </p>

                      <p className="mt-0.5 font-mono text-sm font-semibold text-white">
                        {difference.toFixed(2)} ms
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOTÃO PRINCIPAL */}
          {status === "idle" && (
            <Button
              onClick={startGame}
              className="
                h-14 w-full rounded-xl
                bg-[#c8f31d] text-sm font-bold
                text-[#101509]
                transition-all hover:bg-[#d9ff53]
                active:scale-[0.98]
              "
            >
              <Play className="mr-2 size-4 fill-current" />
              Iniciar cronômetro
            </Button>
          )}

          {isRunning && (
            <Button
              onClick={stopGame}
              className="
                h-14 w-full rounded-xl
                bg-[#e5484d] text-sm font-bold
                text-white
                transition-all hover:bg-[#f05257]
                active:scale-[0.98]
              "
            >
              <Square className="mr-2 size-4 fill-current" />
              PARAR CRONÔMETRO
            </Button>
          )}

          {isFinished && (
            <Button
              onClick={resetGame}
              className="
                h-14 w-full rounded-xl
                bg-[#c8f31d] text-sm font-bold
                text-[#101509]
                transition-all hover:bg-[#d9ff53]
                active:scale-[0.98]
              "
            >
              <RotateCcw className="mr-2 size-4" />
              Tentar novamente
            </Button>
          )}

          {/* RODAPÉ */}
          <div className="flex items-center justify-between border-t border-white/[0.07] pt-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="size-4 text-zinc-500" />

              <span className="text-xs text-zinc-500">
                Tentativas nesta sessão
              </span>
            </div>

            <span className="font-mono text-sm font-semibold text-white">
              {String(attempts).padStart(2, "0")}
            </span>
          </div>

          <p className="text-center text-[10px] leading-relaxed text-zinc-600">
            Versão de demonstração. Sem pagamentos ou prêmios reais.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}