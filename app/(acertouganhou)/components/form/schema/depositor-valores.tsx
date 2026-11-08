"use client"

import { cn } from "@/lib/utils"

interface DepositoValoresProps {
  value: number
  onChange: (value: number) => void
  withOffer: boolean
  disabled?: boolean
}

const valores = [
  { valor: 1000, bonus: 3 },
  { valor: 2000, bonus: 6 },
  { valor: 5000, bonus: 10, popular: true },
  { valor: 10000, bonus: 20 },
  { valor: 20000, bonus: 25 },
  { valor: 50000, bonus: 50 },
]

export function DepositoValores({
  value,
  onChange,
  withOffer,
  disabled,
}: DepositoValoresProps) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-white">
        Escolha o valor
      </span>

      <div className="grid grid-cols-3 gap-2">
        {valores.map((item) => {
          const active = value === item.valor

          return (
            <button
              key={item.valor}
              type="button"
              disabled={disabled}
              onClick={() => onChange(item.valor)}
              className={cn(
                "relative flex min-h-19 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 transition-all",
                "disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-[#C8F31D] bg-[#C8F31D]/10 text-[#C8F31D]"
                  : "border-white/10 bg-[#171C19] text-white hover:border-white/30"
              )}
            >
              {item.popular && (
                <span className="absolute -top-2 rounded-full bg-[#C8F31D] px-2 py-0.5 text-[9px] font-bold text-black">
                  POPULAR
                </span>
              )}

              <span className="text-base font-bold">
                R$ {item.valor / 100}
              </span>

              {withOffer && (
                <span className="text-[10px] text-[#C8F31D]">
                  +{item.bonus} giros
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}