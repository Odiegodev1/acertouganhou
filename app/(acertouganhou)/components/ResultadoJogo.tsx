"use client"

import { motion } from "motion/react"
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Target,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"

interface ResultadoJogoProps {
  ganhou: boolean
  premio: string
  tempoAlvo: number
  tempoJogador: number
  onTentarNovamente: () => void
  onVoltar: () => void
}

export function ResultadoJogo({
  ganhou,
  premio,
  tempoAlvo,
  tempoJogador,
  onTentarNovamente,
  onVoltar,
}: ResultadoJogoProps) {
  const diferenca = Math.abs(tempoAlvo - tempoJogador)

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-3xl bg-[#101510] p-5 text-center text-white sm:p-8"
    >
      {/* ILUMINAÇÃO */}
      <div
        className={`pointer-events-none absolute left-1/2 top-0 h-48 w-72 -translate-x-1/2 rounded-full blur-[90px] ${
          ganhou ? "bg-[#c8f31d]/15" : "bg-red-500/10"
        }`}
      />

      {/* ÍCONE */}
      <motion.div
        initial={{ scale: 0.5, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 15,
        }}
        className={`relative mx-auto mb-5 flex size-24 items-center justify-center rounded-full border ${
          ganhou
            ? "border-[#c8f31d]/30 bg-[#c8f31d]/10"
            : "border-red-400/20 bg-red-400/10"
        }`}
      >
        {ganhou ? (
          <Trophy className="size-11 text-[#c8f31d]" />
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
            <Sparkles className="size-6 text-[#c8f31d]" />
          </motion.div>
        )}
      </motion.div>

      {/* RESULTADO */}
      <div className="relative">
        <span
          className={`mb-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${
            ganhou
              ? "border-[#c8f31d]/20 bg-[#c8f31d]/10 text-[#c8f31d]"
              : "border-red-400/20 bg-red-400/10 text-red-400"
          }`}
        >
          {ganhou ? "Desafio concluído" : "Desafio encerrado"}
        </span>

        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          {ganhou ? (
            <>
              Você{" "}
              <span className="text-[#c8f31d]">acertou!</span>
            </>
          ) : (
            <>
              Você{" "}
              <span className="text-red-400">perdeu!</span>
            </>
          )}
        </h2>

        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-zinc-400">
          {ganhou
            ? `Parabéns! Você acertou o tempo e conquistou ${premio}.`
            : "Não foi dessa vez! Tente novamente e mostre sua precisão."}
        </p>
      </div>

      {/* TEMPOS */}
      <div className="relative mt-7 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="text-[11px] text-zinc-500">
            Tempo do desafio
          </p>

          <p className="mt-2 text-2xl font-bold tabular-nums text-white">
            {tempoAlvo.toFixed(2)}
            <span className="ml-1 text-sm text-zinc-500">s</span>
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="text-[11px] text-zinc-500">
            Seu tempo
          </p>

          <p
            className={`mt-2 text-2xl font-bold tabular-nums ${
              ganhou ? "text-[#c8f31d]" : "text-red-400"
            }`}
          >
            {tempoJogador.toFixed(2)}
            <span className="ml-1 text-sm text-zinc-500">s</span>
          </p>
        </div>
      </div>

      {/* DIFERENÇA */}
      {!ganhou && (
        <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <p className="text-xs text-zinc-400">
            Faltaram apenas{" "}
            <span className="font-bold text-white">
              {diferenca.toFixed(2)} segundos
            </span>{" "}
            para o tempo exato.
          </p>
        </div>
      )}

      {/* BOTÕES */}
      <div className="relative mt-7 space-y-3">
        <Button
          type="button"
          onClick={onTentarNovamente}
          className="h-12 w-full rounded-xl bg-[#c8f31d] text-sm font-bold text-[#101510] hover:bg-[#d9ff53]"
        >
          <RotateCcw className="mr-2 size-4" />
          {ganhou ? "Jogar novamente" : "Tentar novamente"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onVoltar}
          className="h-11 w-full rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="mr-2 size-4" />
          Voltar aos desafios
        </Button>
      </div>
    </motion.div>
  )
}