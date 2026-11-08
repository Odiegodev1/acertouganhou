"use client"

import { useState } from "react"
import { toast } from "sonner"

import {
  CheckCircle2,
  CircleHelp,
  LoaderCircle,
  Save,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PixType = "CPF" | "EMAIL" | "PHONE" | "RANDOM"

interface PerfilPixProps {
  initialPixKey?: string
  initialPixType?: PixType
  onSavePix?: (data: {
    type: PixType
    key: string
  }) => Promise<void>
}

const pixTypes: { value: PixType; label: string }[] = [
  { value: "CPF", label: "CPF" },
  { value: "EMAIL", label: "E-mail" },
  { value: "PHONE", label: "Celular" },
  { value: "RANDOM", label: "Aleatória" },
]

export function PerfilPix({
  initialPixKey = "",
  initialPixType = "CPF",
  onSavePix,
}: PerfilPixProps) {
  const [type, setType] = useState<PixType>(initialPixType)
  const [key, setKey] = useState(initialPixKey)
  const [loading, setLoading] = useState(false)

  const placeholders: Record<PixType, string> = {
    CPF: "000.000.000-00",
    EMAIL: "seuemail@exemplo.com",
    PHONE: "+55 (21) 99999-9999",
    RANDOM: "Informe sua chave aleatória",
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()

    if (!key.trim()) {
      toast.error("Informe sua chave Pix.")
      return
    }

    if (!onSavePix) {
      toast.info("O cadastro da chave Pix ainda não está conectado ao banco.")
      return
    }

    try {
      setLoading(true)

      await onSavePix({
        type,
        key: key.trim(),
      })

      toast.success("Chave Pix salva com sucesso!")
    } catch {
      toast.error("Não foi possível salvar a chave Pix.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#111612] p-5 sm:p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
          <Wallet className="size-5 text-[#C8F31D]" />
        </div>

        <div>
          <h2 className="text-base font-bold text-white">
            Chave Pix
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Configure uma chave Pix para futuros recebimentos.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="mb-3 block text-xs font-medium text-zinc-300">
            Tipo de chave
          </label>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {pixTypes.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setType(item.value)
                  setKey("")
                }}
                className={cn(
                  "flex h-11 items-center justify-center rounded-xl border text-xs font-semibold transition-colors",
                  type === item.value
                    ? "border-[#C8F31D] bg-[#C8F31D]/10 text-[#C8F31D]"
                    : "border-white/10 bg-[#090c0a] text-zinc-400 hover:border-white/20 hover:text-white"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="pix-key"
            className="mb-2 block text-xs font-medium text-zinc-300"
          >
            Sua chave Pix
          </label>

          <Input
            id="pix-key"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder={placeholders[type]}
            autoComplete="off"
            className="h-12 rounded-xl border-white/10 bg-[#090c0a] px-4 text-white placeholder:text-zinc-600 focus-visible:border-[#C8F31D]"
          />
        </div>

        {initialPixKey && (
          <div className="flex items-center gap-2 rounded-xl border border-[#C8F31D]/15 bg-[#C8F31D]/5 p-3">
            <CheckCircle2 className="size-4 shrink-0 text-[#C8F31D]" />

            <p className="text-xs text-[#C8F31D]">
              Existe uma chave Pix cadastrada nesta conta.
            </p>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <CircleHelp className="mt-0.5 size-4 shrink-0 text-zinc-400" />

          <p className="text-xs leading-relaxed text-zinc-500">
            Esta configuração é demonstrativa. O cadastro da chave
            não realiza transferências nem habilita saques reais.
          </p>
        </div>

        <div className="flex justify-end border-t border-white/[0.06] pt-5">
          <Button
            type="submit"
            isDisabled={loading || !key.trim()}
            className="h-11 rounded-xl bg-[#C8F31D] px-5 font-bold text-[#101510] hover:bg-[#B8E31A]"
          >
            {loading ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}

            Salvar chave Pix
          </Button>
        </div>
      </form>
    </section>
  )
}