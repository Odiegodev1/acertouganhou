import Link from "next/link"

import {
  ArrowRight,
  Gamepad2,
  Target,
  Trophy,
  Wallet,
} from "lucide-react"

import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"


import { HistoricoJogadas } from "./components/historico-jogadas"
import { MeusPremios } from "./components/meus-premios"
import { getPlayerHistory } from "../components/form/actions/game/get-player-history"

export const instant = false
export default async function PremioPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const result = await getPlayerHistory()

  if (!result.success) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 text-center text-white">
        Não foi possível carregar seu histórico.
      </main>
    )
  }

  const attempts = result.attempts
  const claims = result.claims

  const totalJogadas = attempts.length

  const totalVitorias = attempts.filter(
    (attempt) => attempt.status === "WON"
  ).length

  const totalGasto = attempts.reduce(
    (total, attempt) => total + attempt.playCost,
    0
  )

  const taxaAcerto =
    totalJogadas > 0
      ? Math.round((totalVitorias / totalJogadas) * 100)
      : 0

  const stats = [
    {
      label: "Jogadas",
      value: totalJogadas.toString(),
      icon: Gamepad2,
    },
    {
      label: "Vitórias",
      value: totalVitorias.toString(),
      icon: Trophy,
    },
   
   
  ]

  return (
    <main className="min-h-screen bg-[#090c0a] pb-24 text-white sm:pb-12">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">

        {/* CABEÇALHO */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#c8f31d]">
              Minha conta
            </span>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Meus <span className="text-[#c8f31d]">prêmios</span>
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
              Veja suas conquistas, acompanhe cada jogada
              e descubra o quanto faltou para acertar.
            </p>
          </div>

          <Link
            href="/jogar"
            className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-[#c8f31d] px-5 text-sm font-bold text-[#101510] transition-colors hover:bg-[#d9ff53]"
          >
            Jogar novamente
            <ArrowRight className="size-4" />
          </Link>
        </div>

      

        {/* SEÇÕES */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">

          {/* HISTÓRICO */}
          <HistoricoJogadas attempts={attempts} />

          {/* PRÊMIOS GANHOS */}
          <MeusPremios claims={claims} />
        </div>
      </div>
    </main>
  )
}