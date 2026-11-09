"use client"

import * as React from "react"

import { QRCodeSVG } from "qrcode.react"

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  LoaderCircle,
  QrCode,
  ShieldCheck,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface PixPaymentProps {
  amount: number
  pixCopyPaste: string
  expiresAt?: string | null
  checkingPayment: boolean
  onBack: () => void
  onCheckPayment: () => void
}

function formatCurrency(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`
}

export function PixPayment({
  amount,
  pixCopyPaste,
  expiresAt,
  checkingPayment,
  onBack,
  onCheckPayment,
}: PixPaymentProps) {
  const [copied, setCopied] = React.useState(false)

  const [showQrCode, setShowQrCode] =
    React.useState(false)

  const [remainingSeconds, setRemainingSeconds] =
    React.useState<number | null>(null)

  // =====================================================
  // COUNTDOWN
  // =====================================================

  React.useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(null)
      return
    }

    function updateCountdown() {
      const difference =
        new Date(expiresAt!).getTime() - Date.now()

      setRemainingSeconds(
        Math.max(0, Math.floor(difference / 1000))
      )
    }

    updateCountdown()

    const interval = window.setInterval(
      updateCountdown,
      1000
    )

    return () => window.clearInterval(interval)
  }, [expiresAt])

  const expired =
    remainingSeconds !== null &&
    remainingSeconds <= 0

  // =====================================================
  // COPY PIX
  // =====================================================

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(
        pixCopyPaste
      )

      setCopied(true)

      toast.success("Código Pix copiado!")

      window.setTimeout(() => {
        setCopied(false)
      }, 2500)
    } catch {
      toast.error(
        "Não foi possível copiar o código Pix."
      )
    }
  }

  return (
    <div className="mx-auto w-full max-w-md pb-3">
      {/* HEADER */}

      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </button>

        <span className="rounded-full border border-[#C8F31D]/20 bg-[#C8F31D]/10 px-3 py-1.5 text-xs font-semibold text-[#C8F31D]">
          Pix
        </span>
      </div>

      {/* VALOR */}

      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#C8F31D]/10">
          <Wallet className="size-7 text-[#C8F31D]" />
        </div>

        <h2 className="mt-4 text-xl font-bold tracking-tight text-white sm:text-2xl">
          Finalize seu depósito
        </h2>

        <p className="mt-2 text-sm text-white/50">
          Copie o código e pague pelo aplicativo do seu banco.
        </p>

        <p className="mt-5 text-4xl font-bold tracking-tight text-white">
          {formatCurrency(amount)}
        </p>

        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/10 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300">
          <span className="size-1.5 animate-pulse rounded-full bg-amber-300" />
          Aguardando pagamento
        </div>
      </div>

      {/* COPIA E COLA */}

      <div className="mt-7 rounded-2xl border border-white/10 bg-[#171C19] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#C8F31D]/10">
            <Copy className="size-5 text-[#C8F31D]" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">
              Pix Copia e Cola
            </h3>

            <p className="mt-0.5 text-xs text-white/40">
              Forma mais rápida de pagar
            </p>
          </div>
        </div>

        <div className="mt-5 min-w-0 rounded-xl border border-white/[0.07] bg-[#0B0F0C] p-3">
          <p className="line-clamp-3 break-all font-mono text-[11px] leading-5 text-white/50">
            {pixCopyPaste}
          </p>
        </div>

        <Button
          type="button"
          onClick={copyPix}
          className="mt-4 h-12 w-full rounded-xl bg-[#C8F31D] text-sm font-bold text-[#101510] hover:bg-[#B8E31A]"
        >
          {copied ? (
            <>
              <Check className="mr-2 size-4" />
              Código copiado!
            </>
          ) : (
            <>
              <Copy className="mr-2 size-4" />
              Copiar código Pix
            </>
          )}
        </Button>

        <p className="mt-3 text-center text-[11px] text-white/35">
          Abra seu banco → Pix → Copia e Cola
        </p>
      </div>

      {/* QR CODE OPCIONAL */}

      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#171C19]">
        <button
          type="button"
          aria-expanded={showQrCode}
          onClick={() => setShowQrCode((current) => !current)}
          className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-white/[0.03]"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/[0.05]">
              <QrCode className="size-5 text-white/70" />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                {showQrCode
                  ? "Ocultar QR Code"
                  : "Pagar com QR Code"}
              </p>

              <p className="mt-0.5 text-xs text-white/40">
                {showQrCode
                  ? "Toque para recolher"
                  : "Prefere escanear? Toque aqui"}
              </p>
            </div>
          </div>

          <ChevronDown
            className={`size-4 text-white/50 transition-transform ${
              showQrCode ? "rotate-180" : ""
            }`}
          />
        </button>

        {showQrCode && (
          <div className="border-t border-white/[0.07] px-4 pb-5 pt-5">
            <div className="mx-auto w-fit max-w-full rounded-2xl bg-white p-3">
              <QRCodeSVG
                value={pixCopyPaste}
                size={200}
                level="M"
                marginSize={0}
                title="QR Code Pix"
                className="h-auto max-w-full"
              />
            </div>

            <p className="mt-4 text-center text-xs text-white/50">
              Escaneie com o aplicativo do seu banco.
            </p>
          </div>
        )}
      </div>

      {/* EXPIRAÇÃO */}

      {remainingSeconds !== null && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs">
          <Clock3
            className={`size-4 ${
              expired ? "text-red-400" : "text-white/50"
            }`}
          />

          <span
            className={
              expired ? "text-red-400" : "text-white/50"
            }
          >
            {expired
              ? "Prazo da cobrança encerrado"
              : `Expira em ${formatTime(remainingSeconds)}`}
          </span>
        </div>
      )}

      {/* CONFIRMAÇÃO */}

      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#C8F31D]" />

          <div>
            <p className="text-sm font-semibold text-white">
              Confirmação automática
            </p>

            <p className="mt-1 text-xs leading-relaxed text-white/50">
              Estamos verificando seu depósito.
              Assim que o pagamento for confirmado,
              o saldo será atualizado automaticamente.
            </p>
          </div>
        </div>
      </div>

      {/* VERIFICAR */}

      <Button
        type="button"
        variant="outline"
        onClick={onCheckPayment}
        isDisabled={checkingPayment}
        className="mt-4 h-11 w-full rounded-xl border-white/10 bg-transparent text-white hover:bg-white/5"
      >
        {checkingPayment ? (
          <LoaderCircle className="mr-2 size-4 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-2 size-4" />
        )}

        Já paguei, verificar pagamento
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 w-full py-2 text-center text-xs text-white/40 hover:text-white"
      >
        Voltar para carteira
      </button>
    </div>
  )
}