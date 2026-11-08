import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

import { PerfilHeader } from "./components/perfil-header"
import { PerfilDados } from "./components/perfil-dados"
import { PerfilPix } from "./components/perfilpix"
import { PerfilSeguranca } from "./components/perfilseguranca"

export const instant = false
export default async function PerfilPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const name = session.user.name || "Usuário"
  const email = session.user.email || ""

  return (
    <main className="min-h-screen bg-[#090c0a] pb-24 text-white sm:pb-12">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">

        {/* TÍTULO */}
        <div className="mb-7">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8F31D]">
            Minha conta
          </span>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Configurações do{" "}
            <span className="text-[#C8F31D]">perfil</span>
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Gerencie seus dados pessoais, segurança e preferências
            de recebimento.
          </p>
        </div>

        {/* PERFIL */}
        <PerfilHeader name={name} email={email} />

        {/* CONFIGURAÇÕES */}
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-2">

          <div className="space-y-6">
            <PerfilDados
              initialName={name}
              email={email}
            />

            <PerfilPix />
          </div>

          <div>
            <PerfilSeguranca />
          </div>
        </div>

        {/* RODAPÉ */}
        <div className="mt-8 border-t border-white/[0.06] pt-5">
          <p className="text-center text-xs text-zinc-600">
            AcertouGanhou · Configurações da conta
          </p>
        </div>
      </div>
    </main>
  )
}