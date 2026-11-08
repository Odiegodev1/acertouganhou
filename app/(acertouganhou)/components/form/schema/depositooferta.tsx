"use client"

import { Gift, Sparkles } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface DepositoOfertasProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function DepositoOfertas({
  checked,
  onCheckedChange,
  disabled,
}: DepositoOfertasProps) {
  return (
    <div className="rounded-xl border border-[#C8F31D]/20 bg-[#C8F31D]/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#C8F31D]/10 text-[#C8F31D]">
            <Gift className="size-5" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">
              Ofertas exclusivas
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-white/50">
              Ative para visualizar promoções com
              rodadas grátis.
            </p>
          </div>
        </div>

        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="data-[state=checked]:bg-[#C8F31D]"
        />
      </div>

      {checked && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#C8F31D]/10 p-3 text-xs text-[#C8F31D]">
          <Sparkles className="mt-0.5 size-4 shrink-0" />

          <span>
            As ofertas exibidas são demonstrativas
            e não concedem giros nesta versão.
          </span>
        </div>
      )}
    </div>
  )
}