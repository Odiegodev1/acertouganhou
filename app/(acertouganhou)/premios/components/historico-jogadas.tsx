"use client"

import { useMemo, useState } from "react"

import {
  CheckCircle2,
  Clock3,
  History,
  Search,
  Trophy,
  XCircle,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type PlayerAttempt = {
  id: string
  prizeId: string
  prizeName: string
  playCost: number
  targetMs: number
  elapsedMs: number | null
  status: string
  createdAt: string
}

interface HistoricoJogadasProps {
  attempts: PlayerAttempt[]
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function formatTime(ms: number | null) {
  if (ms === null) return "—"

  return `${(ms / 1000).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}s`
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function HistoricoJogadas({
  attempts,
}: HistoricoJogadasProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<
    "all" | "won" | "lost"
  >("all")

  const filteredAttempts = useMemo(() => {
    return attempts.filter((attempt) => {
      const matchesSearch = attempt.prizeName
        .toLowerCase()
        .includes(search.toLowerCase())

      const won = attempt.status === "WON"
      const lost = attempt.status === "LOST"

      const matchesFilter =
        filter === "all" ||
        (filter === "won" && won) ||
        (filter === "lost" && lost)

      return matchesSearch && matchesFilter
    })
  }, [attempts, search, filter])

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111612]">
      {/* HEADER */}
      <div className="border-b border-white/10 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <History className="size-5 text-[#c8f31d]" />

              <h2 className="text-lg font-bold text-white">
                Histórico de jogadas
              </h2>
            </div>

            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
              Acompanhe suas tentativas e resultados.
            </p>
          </div>

          <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400">
            {attempts.length} jogadas
          </span>
        </div>

        {/* FILTROS */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar prêmio..."
              className="h-10 border-white/10 bg-[#090c0a] pl-9 text-white"
            />
          </div>

          <div className="flex gap-1 rounded-lg border border-white/10 bg-[#090c0a] p-1">
            {(
              [
                ["all", "Todas"],
                ["won", "Vitórias"],
                ["lost", "Derrotas"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                  filter === value
                    ? "bg-[#c8f31d] text-[#101510]"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LISTA */}
      <div className="divide-y divide-white/[0.06]">
        {filteredAttempts.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <Clock3 className="mb-3 size-8 text-zinc-600" />

            <p className="font-medium text-white">
              Nenhuma jogada encontrada
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Suas tentativas aparecerão aqui.
            </p>
          </div>
        ) : (
          filteredAttempts.map((attempt) => {
            const won = attempt.status === "WON"
            const lost = attempt.status === "LOST"
            const running = !won && !lost

            const difference =
              attempt.elapsedMs !== null
                ? attempt.elapsedMs - attempt.targetMs
                : null

            return (
              <article
                key={attempt.id}
                className="p-4 transition-colors hover:bg-white/[0.02] sm:px-6"
              >
                <div className="flex items-start gap-3">
                  {/* ÍCONE */}
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      won
                        ? "bg-[#c8f31d]/10 text-[#c8f31d]"
                        : lost
                          ? "bg-red-500/10 text-red-400"
                          : "bg-white/5 text-zinc-400"
                    )}
                  >
                    {won ? (
                      <Trophy className="size-5" />
                    ) : lost ? (
                      <XCircle className="size-5" />
                    ) : (
                      <Clock3 className="size-5" />
                    )}
                  </div>

                  {/* INFORMAÇÕES */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-white sm:text-base">
                        {attempt.prizeName}
                      </h3>

                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-bold",
                          won
                            ? "bg-[#c8f31d]/10 text-[#c8f31d]"
                            : lost
                              ? "bg-red-500/10 text-red-400"
                              : "bg-white/5 text-zinc-400"
                        )}
                      >
                        {won
                          ? "GANHOU"
                          : lost
                            ? "NÃO GANHOU"
                            : "EM ANDAMENTO"}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDate(attempt.createdAt)}
                    </p>

                    {/* TEMPOS */}
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/[0.06] bg-[#090c0a] p-3">
                      <div>
                        <p className="text-[10px] text-zinc-500 sm:text-xs">
                          Esperado
                        </p>

                        <p className="mt-1 text-sm font-bold text-white sm:text-base">
                          {formatTime(attempt.targetMs)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-zinc-500 sm:text-xs">
                          Seu tempo
                        </p>

                        <p
                          className={cn(
                            "mt-1 text-sm font-bold sm:text-base",
                            won
                              ? "text-[#c8f31d]"
                              : "text-white"
                          )}
                        >
                          {formatTime(attempt.elapsedMs)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-zinc-500 sm:text-xs">
                          Participação
                        </p>

                        <p className="mt-1 text-sm font-bold text-white sm:text-base">
                          {formatCurrency(attempt.playCost)}
                        </p>
                      </div>
                    </div>

                    {/* RESULTADO DETALHADO */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      {won ? (
                        <span className="flex items-center gap-1.5 text-[#c8f31d]">
                          <CheckCircle2 className="size-3.5" />
                          Você acertou o tempo!
                        </span>
                      ) : lost && difference !== null ? (
                        <span className="text-zinc-400">
                          {difference < 0
                            ? `Você parou ${formatTime(Math.abs(difference))} antes do tempo.`
                            : difference > 0
                              ? `Você passou ${formatTime(difference)} do tempo.`
                              : "Tentativa encerrada sem premiação."}
                        </span>
                      ) : running ? (
                        <span className="text-zinc-500">
                          Tentativa ainda não finalizada.
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}