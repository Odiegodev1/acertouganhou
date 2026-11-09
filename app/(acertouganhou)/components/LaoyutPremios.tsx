import Image, { type StaticImageData } from "next/image"

import {
  Sparkles,
  Clock3,
  Trophy,
  Gamepad2,
} from "lucide-react"

import Iphone from "@/public/layoutiphone.png"
import Tv from "@/public/layouttv.png"
import Play from "@/public/layoutplay.png"
import Dois from "@/public/layoutdois.png"
import Mil from "@/public/layoutmil.png"
import Cinco from "@/public/layoutcinco.png"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { getActiveGames } from "@/lib/game/get-active-games"
import { DialogJogo } from "./DialogJogo"

type PremioVisual = {
  img?: StaticImageData
  tipo: string
  destaque?: boolean
}

const premioVisual: Record<string, PremioVisual> = {
  "1": {
    img: Dois,
    tipo: "Prêmio via Pix",
  },
  "2": {
    img: Iphone,
    tipo: "Tecnologia",
    destaque: true,
  },
  "3": {
    img: Play,
    tipo: "Games",
  },
  "4": {
    img: Mil,
    tipo: "Prêmio via Pix",
  },
  "5": {
    img: Cinco,
    tipo: "Prêmio via Pix",
    destaque: true,
  },
  "6": {
    img: Tv,
    tipo: "Tecnologia",
  },
}

function formatCurrency(valueInCents: number) {
  return (valueInCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function formatTime(milliseconds: number) {
  return (milliseconds / 1000).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
}

interface LaoyutPremiosProps {
  slug?: string
  nome?: string
  desc?: string
}

export async function LaoyutPremios({
  slug,
  nome,
  desc,
}: LaoyutPremiosProps) {
  // Consulta executada exclusivamente no servidor.
  const premios = await getActiveGames()

  const titulo = nome?.trim() || "Prêmios Premium"
  const partesTitulo = titulo.split(/\s+/)

  const primeiraParte = partesTitulo[0] || "Prêmios"
  const segundaParte =
    partesTitulo.slice(1).join(" ") || "Premium"

  return (
    <section className="w-full py-6 sm:py-10">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">

        {/* CABEÇALHO */}
        <div className="mb-5 flex items-end justify-between gap-3 sm:mb-7">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#c8f31d]" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c8f31d] sm:text-xs">
                {slug || "Acertou Ganhou"}
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
              {primeiraParte}{" "}
              <span className="text-[#c8f31d]">
                {segundaParte}
              </span>
            </h2>

            <p className="text-xs text-zinc-500 sm:text-sm">
              {desc || "Escolha seu desafio e tente acertar."}
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 sm:flex">
            <span className="size-1.5 rounded-full bg-[#c8f31d]" />

            <span className="text-xs font-medium text-zinc-400">
              {premios.length} desafios
            </span>
          </div>
        </div>

        {/* ESTADO VAZIO */}
        {premios.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#111612] p-6 text-center">
            <Trophy className="mb-4 size-9 text-[#c8f31d]" />

            <h3 className="text-lg font-semibold text-white">
              Nenhum desafio disponível
            </h3>

            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              Os desafios estão sendo preparados.
              Volte em alguns instantes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:gap-6">
            {premios.map((premio) => {
              // Imagens são apenas apresentação.
              // Um jogo sem imagem cadastrada continua visível.
              const visual = premioVisual[premio.id] ?? {
                tipo: "Desafio de precisão",
                destaque: false,
              }

              const disponivel = premio.stock > 0

              return (
                <Card
                  key={premio.id}
                  className="
                    group relative gap-0 overflow-hidden
                    rounded-2xl border border-white/[0.08]
                    bg-[#111612] p-0 shadow-none
                    transition-all duration-300
                    hover:-translate-y-1
                    hover:border-[#c8f31d]/30
                    hover:bg-[#141b15]
                  "
                >
                  {/* IMAGEM */}
                  <div className="relative aspect-square w-full overflow-hidden bg-[#080c09]">
                    {visual.img ? (
                      <Image
                        src={visual.img}
                        alt={premio.name}
                        fill
                        quality={90}
                        sizes="
                          (max-width: 640px) 50vw,
                          (max-width: 1024px) 33vw,
                          400px
                        "
                        className="
                          object-cover
                          transition-transform duration-500
                          group-hover:scale-[1.035]
                        "
                      />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_center,rgba(200,243,29,0.1),transparent_70%)]">
                        <div className="flex size-16 items-center justify-center rounded-2xl border border-[#c8f31d]/20 bg-[#c8f31d]/10">
                          <Gamepad2 className="size-8 text-[#c8f31d]" />
                        </div>

                        <span className="text-xs font-semibold text-zinc-400">
                          Desafio de precisão
                        </span>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#111612] to-transparent" />

                    {visual.destaque && (
                      <Badge className="absolute left-2 top-2 border-0 bg-[#c8f31d] px-2 py-1 text-[9px] font-bold text-[#101509] shadow-sm sm:left-3 sm:top-3 sm:text-[10px]">
                        <Sparkles className="mr-1 size-3" />
                        DESTAQUE
                      </Badge>
                    )}

                    {!disponivel && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/65">
                        <span className="rounded-full border border-white/20 bg-black/70 px-4 py-2 text-xs font-semibold text-white">
                          Indisponível
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CONTEÚDO */}
                  <div className="flex flex-1 flex-col p-3 pt-2 sm:p-4">
                    <span className="mb-1 text-[10px] font-medium text-zinc-500 sm:text-xs">
                      {visual.tipo}
                    </span>

                    <h3 className="line-clamp-1 text-sm font-bold text-white sm:text-lg">
                      {premio.name}
                    </h3>

                    {/* TEMPO */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <Clock3 className="size-3.5 text-[#c8f31d]" />

                      <span className="text-[11px] text-zinc-400 sm:text-xs">
                        Acerte em {formatTime(premio.targetMs)}s
                      </span>
                    </div>

                    <div className="my-3 h-px w-full bg-white/[0.06] sm:my-4" />

                    {/* PREÇO */}
                    <div className="mb-3 sm:mb-4">
                      <p className="mb-1 text-[10px] text-zinc-500 sm:text-xs">
                        Participação
                      </p>

                      <span className="text-xl font-extrabold tracking-tight text-[#c8f31d] sm:text-2xl">
                        {formatCurrency(premio.playCost)}
                      </span>
                    </div>

                    {/* JOGO */}
                    <div className="mt-auto">
                      {disponivel ? (
                        <DialogJogo
                          id={premio.id}
                          time={premio.targetMs / 1000}
                          nome={premio.name}
                          tipo={visual.tipo}
                          valor={premio.playCost / 100}
                          img={visual.img}
                        />
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="
                            h-11 w-full cursor-not-allowed
                            rounded-xl border border-white/10
                            bg-white/5 text-sm font-semibold
                            text-zinc-500
                          "
                        >
                          Indisponível
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* RODAPÉ */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center sm:mt-8">
          <Sparkles className="size-3.5 text-[#c8f31d]/60" />

          <p className="text-[11px] text-zinc-500 sm:text-xs">
            Escolha um desafio e coloque sua precisão à prova.
          </p>
        </div>
      </div>
    </section>
  )
}