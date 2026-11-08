import {
    ArrowUpRight,
    Gift,
    Trophy,
  } from "lucide-react"
  
  export type PlayerClaim = {
    id: string
    prizeId: string
    prizeName: string
    createdAt: string
  }
  
  interface MeusPremiosProps {
    claims: PlayerClaim[]
  }
  
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }
  
  export function MeusPremios({
    claims,
  }: MeusPremiosProps) {
    return (
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111612]">
        <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-[#c8f31d]" />
  
              <h2 className="text-lg font-bold text-white">
                Meus prêmios
              </h2>
            </div>
  
            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
              Todas as suas conquistas.
            </p>
          </div>
  
          <span className="rounded-full bg-[#c8f31d]/10 px-3 py-1.5 text-xs font-bold text-[#c8f31d]">
            {claims.length} ganhos
          </span>
        </div>
  
        {claims.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#c8f31d]/10">
              <Gift className="size-7 text-[#c8f31d]" />
            </div>
  
            <h3 className="font-semibold text-white">
              Seu primeiro prêmio está por vir
            </h3>
  
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
              Quando você vencer um desafio, sua conquista
              aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center gap-3 p-4 sm:px-6"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#c8f31d]/10">
                  <Trophy className="size-6 text-[#c8f31d]" />
                </div>
  
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-white">
                    {claim.prizeName}
                  </h3>
  
                  <p className="mt-1 text-xs text-zinc-500">
                    Conquistado em {formatDate(claim.createdAt)}
                  </p>
                </div>
  
                <span className="rounded-full border border-[#c8f31d]/20 bg-[#c8f31d]/10 px-2.5 py-1 text-[10px] font-bold text-[#c8f31d]">
                  GANHOU
                </span>
              </div>
            ))}
          </div>
        )}
  
        <div className="border-t border-white/[0.06] px-4 py-3 sm:px-6">
          <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <ArrowUpRight className="size-3.5" />
            Conquistas demonstrativas, sem valor monetário.
          </p>
        </div>
      </section>
    )
  }