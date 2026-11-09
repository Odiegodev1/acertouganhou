"use client"

import {
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

import { Button } from "@/components/ui/button"

interface PaymentSuccessProps {
  amount: number
  onClose: () => void
}

function formatCurrency(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function PaymentSuccess({
  amount,
  onClose,
}: PaymentSuccessProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center py-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full border border-[#C8F31D]/20 bg-[#C8F31D]/10">
        <CheckCircle2 className="size-10 text-[#C8F31D]" />
      </div>

      <h2 className="mt-6 text-2xl font-bold text-white">
        Pagamento confirmado!
      </h2>

      <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/50">
        Seu depósito foi confirmado e o valor
        já está disponível na sua carteira.
      </p>

      <div className="mt-8 w-full rounded-2xl border border-[#C8F31D]/20 bg-[#C8F31D]/5 p-6">
        <p className="text-xs text-white/50">
          Valor creditado
        </p>

        <p className="mt-2 text-4xl font-bold tracking-tight text-[#C8F31D]">
          {formatCurrency(amount)}
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#C8F31D]">
          <CheckCircle2 className="size-4" />
          Saldo atualizado
        </div>
      </div>

      <Button
        type="button"
        onClick={onClose}
        className="mt-8 h-12 w-full rounded-xl bg-[#C8F31D] font-bold text-[#101510] hover:bg-[#B8E31A]"
      >
        Ir para carteira
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  )
}