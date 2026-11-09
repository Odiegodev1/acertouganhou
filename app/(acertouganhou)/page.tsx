import { Suspense } from "react"
import { connection } from "next/server"

import { auth } from "@/lib/auth"

import { HeaderComponents } from "./components/HeaderComponents"
import { InputPremio } from "./components/InputPremeio"
import { LaoyutPremios } from "./components/LaoyutPremios"

// =====================================================
// HEADER — RENDERIZADO POR REQUISIÇÃO
// =====================================================

async function Header() {
  // Impede que o auth() seja executado no pré-render.
  // A autenticação acontece no contexto da requisição.
  await connection()

  const session = await auth()

  return (
    <HeaderComponents
      id={session?.user?.id}
      name={session?.user?.name ?? ""}
      img={session?.user?.image ?? ""}
    />
  )
}

// =====================================================
// HEADER SKELETON
// =====================================================

function HeaderSkeleton() {
  return (
    <div className="w-full bg-[#090c0a] px-4 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="h-10 w-32 animate-pulse rounded-lg bg-white/10" />

        <div className="h-10 w-28 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  )
}

// =====================================================
// PRÊMIOS SKELETON
// =====================================================

function PremiosSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-white/10 bg-[#111612]"
        >
          <div className="aspect-square animate-pulse bg-white/5" />

          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />

            <div className="h-4 w-1/2 animate-pulse rounded bg-white/5" />

            <div className="h-10 animate-pulse rounded-xl bg-[#C8F31D]/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function Page() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-2">
      {/* HEADER */}
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      {/* CONTEÚDO */}
      <main className="space-y-10 p-4">
        <InputPremio />

        <Suspense fallback={<PremiosSkeleton />}>
          <LaoyutPremios />
        </Suspense>
      </main>
    </div>
  )
}