"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Save, UserRound, Mail, LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PerfilDadosProps {
  initialName: string
  email: string
  onSaveName?: (name: string) => Promise<void>
}

export function PerfilDados({
  initialName,
  email,
  onSaveName,
}: PerfilDadosProps) {
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)

  const changed = name.trim() !== initialName.trim()

  async function handleSave() {
    if (name.trim().length < 3) {
      toast.error("O nome deve ter pelo menos 3 caracteres.")
      return
    }

    if (!onSaveName) {
      toast.info("A atualização do nome ainda não está conectada ao banco.")
      return
    }

    try {
      setLoading(true)
      await onSaveName(name.trim())
      toast.success("Nome atualizado com sucesso!")
    } catch {
      toast.error("Não foi possível atualizar seu nome.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#111612] p-5 sm:p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
          <UserRound className="size-5 text-[#C8F31D]" />
        </div>

        <div>
          <h2 className="text-base font-bold text-white">
            Informações pessoais
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Gerencie as informações básicas da sua conta.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="profile-name"
            className="mb-2 block text-xs font-medium text-zinc-300"
          >
            Nome completo
          </label>

          <Input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            autoComplete="name"
            className="h-12 rounded-xl border-white/10 bg-[#090c0a] px-4 text-white focus-visible:border-[#C8F31D]"
          />
        </div>

        <div>
          <label
            htmlFor="profile-email"
            className="mb-2 block text-xs font-medium text-zinc-300"
          >
            E-mail
          </label>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />

            <Input
              id="profile-email"
              value={email}
              readOnly
              className="h-12 rounded-xl border-white/10 bg-[#090c0a] pl-11 text-zinc-500"
            />
          </div>

          <p className="mt-2 text-xs text-zinc-600">
            O e-mail não pode ser alterado por esta tela.
          </p>
        </div>

        <div className="flex justify-end border-t border-white/[0.06] pt-5">
          <Button
            type="button"
            onClick={handleSave}
            isDisabled={!changed || loading}
            className="h-11 rounded-xl bg-[#C8F31D] px-5 font-bold text-[#101510] hover:bg-[#B8E31A]"
          >
            {loading ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Salvar alterações
          </Button>
        </div>
      </div>
    </section>
  )
}