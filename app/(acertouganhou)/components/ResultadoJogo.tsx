"use client"

import { motion } from "motion/react"
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Target,
  Sparkles,
  Clock3,
  Wifi,
} from "lucide-react"

import { Button } from "@/components/ui/button"

interface ResultadoJogoProps {
  ganhou: boolean
  premio: string
  tempoAlvo: number
  tempoJogador: number
  tempoOficial?: number
  compensacaoLatencia?: number
  onTentarNovamente: () => void
  onVoltar: () => void
}

function formatarTempo(ms: number) {
  return (Math.max(0, ms) / 1000).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
}

export function ResultadoJogo({
  ganhou,
  premio,
  tempoAlvo,
  tempoJogador,
  tempoOficial,
  compensacaoLatencia,
  onTentarNovamente,
  onVoltar,
}: ResultadoJogoProps) {
  const tempoValidado = tempoOficial ?? tempoJogador

  const diferenca = Math.abs(tempoAlvo - tempoValidado)

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-3xl  p-5 text-center text-white sm:p-8"
    >
      {/* ILUMINAÇÃO */}
      <div
        className={`pointer-events-none absolute left-1/2 top-0 h-48 w-72 -translate-x-1/2 rounded-full blur-[90px] ${
          ganhou ? "" : ""
        }`}
      />

   

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
              Você <span className="text-[#c8f31d]">acertou!</span>
            </>
          ) : (
            <>
              Você <span className="text-red-400">perdeu!</span>
            </>
          )}
        </h2>

        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-zinc-400">
          {ganhou
            ? `Parabéns! Você acertou o tempo do desafio ${premio}.`
            : "Não foi dessa vez! Tente novamente e mostre sua precisão."}
        </p>
      </div>

      {/* TEMPO CONGELADO */}
      <div className="relative mt-7 overflow-hidden rounded-2xl border border-white/10 bg-[#080b09] px-4 py-7">
        <div className="flex items-center justify-center gap-2">
          <Clock3 className="size-4 text-zinc-500" />

          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Seu cronômetro parou em
          </span>
        </div>

        <p
          className={`mt-4 font-mono text-[clamp(2.8rem,12vw,4.2rem)] font-black tracking-[-0.06em] tabular-nums ${
            ganhou ? "text-[#c8f31d]" : "text-white"
          }`}
        >
          {formatarTempo(tempoJogador)}
          <span className="ml-1 text-lg text-zinc-500">s</span>
        </p>

        <p className="mt-3 text-xs text-zinc-500">
          Tempo congelado no momento em que você parou
        </p>
      </div>

      {/* COMPARAÇÃO */}
  

      {/* DIFERENÇA */}
      <div className="relative mt-3 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
        <span className="text-xs text-zinc-400">
        Tempo-alvo
        </span>

        <span className="font-mono text-sm font-bold text-white">
        {formatarTempo(tempoAlvo)}s
        </span>
      </div>
      <div className="relative mt-3 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
        <span className="text-xs text-zinc-400">
          Diferença do tempo-alvo
        </span>

        <span className="font-mono text-sm font-bold text-white">
          {formatarTempo(diferenca)}s
        </span>
      </div>

      {/* LATÊNCIA */}
    

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