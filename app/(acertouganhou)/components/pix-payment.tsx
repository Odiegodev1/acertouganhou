"use client"

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"

import {
  Check,
  Clock3,
  Copy,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"

interface PixPaymentProps {
  amount: number
  pixCode: string
  expiresAt: string | null
  onClose: () => void
}

function formatCurrency(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function formatRemaining(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`
}

export function PixPayment({
  amount,
  pixCode,
  expiresAt,
  onClose,
}: PixPaymentProps) {
  const [copied, setCopied] = React.useState(false)
  const [remaining, setRemaining] = React.useState<number | null>(
    null
  )

  React.useEffect(() => {
    if (!expiresAt) {
      setRemaining(null)
      return
    }

    function updateRemaining() {
      const difference =
        new Date(expiresAt!).getTime() - Date.now()

      setRemaining(
        Math.max(0, Math.floor(difference / 1000))
      )
    }

    updateRemaining()

    const interval = window.setInterval(updateRemaining, 1000)

    return () => window.clearInterval(interval)
  }, [expiresAt])

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(pixCode)

      setCopied(true)
      toast.success("Código Pix copiado!")

      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Não foi possível copiar o código Pix.")
    }
  }

  const expired = remaining !== null && remaining <= 0

  return (
    <div className="mx-auto w-full max-w-md space-y-6 pb-4 text-white">
      <div className="text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#C8F31D]/10">
          <ShieldCheck className="size-6 text-[#C8F31D]" />
        </div>

        <h2 className="mt-4 text-2xl font-bold">
          Pagar com Pix
        </h2>

        <p className="mt-2 text-sm text-white/50">
          Escaneie o QR Code ou copie o código Pix.
        </p>

        <p className="mt-4 text-3xl font-bold text-[#C8F31D]">
          {formatCurrency(amount)}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#171C19] p-5">
        <div className="mx-auto flex w-fit items-center justify-center rounded-2xl bg-white p-4">
          <QRCodeSVG
            value={pixCode}
            size={220}
            level="M"
            marginSize={0}
            title="QR Code Pix"
          />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-sm">
          <Clock3 className="size-4 text-[#C8F31D]" />

          {remaining === null ? (
            <span className="text-white/60">
              Consulte a validade da cobrança
            </span>
          ) : expired ? (
            <span className="text-red-400">
              Prazo de pagamento encerrado
            </span>
          ) : (
            <span className="text-white/60">
              Expira em{" "}
              <strong className="text-white">
                {formatRemaining(remaining)}
              </strong>
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">
          Pix Copia e Cola
        </p>

        <div className="rounded-xl border border-white/10 bg-[#171C19] p-4">
          <p className="break-all text-xs leading-relaxed text-white/50">
            {pixCode}
          </p>
        </div>

        <Button
          type="button"
          onClick={copyPix}
          isDisabled={expired}
          className="h-12 w-full rounded-xl bg-[#C8F31D] font-bold text-[#101510] hover:bg-[#B8E31A]"
        >
          {copied ? (
            <>
              <Check className="mr-2 size-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="mr-2 size-4" />
              Copiar código Pix
            </>
          )}
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-center text-xs leading-relaxed text-white/50">
          A geração do QR Code não confirma o pagamento.
          O saldo só será atualizado após a confirmação
          da transação pelo provedor.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="h-11 w-full rounded-xl border-white/10 bg-transparent text-white hover:bg-white/5"
      >
        Voltar para carteira
      </Button>
    </div>
  )
}