"use client"

import * as React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  ArrowRight,
  Clock3,
  LoaderCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"

import {
  formSchemaDeposito,
  type FormSchemaDeposito,
} from "./schema/formdeposito"

import { DepositoValores } from "./schema/depositor-valores"

import { PixPayment } from "./pix-payment"
import { PaymentSuccess } from "./payment-success"
import { notifyGameWalletUpdated } from "@/lib/wallet-events"



interface FormDepositoProps {
  onClose: () => void
  onSuccess?: () => void
}

type DepositStep =
  | "form"
  | "pix"
  | "preview"
  | "success"

interface DepositData {
  id: string
  amount: number
  status: string
  pixCopyPaste?: string | null
  expiresAt?: string | null
}

interface DepositResponse {
  success: boolean
  mode?: "PIX" | "PREVIEW"
  error?: string
  deposit?: DepositData
}

interface DepositStatusResponse {
  success: boolean
  deposit?: {
    id: string
    status: string
    credited: boolean
  }
}

function formatCurrency(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function parseCurrency(value: string) {
  return Number(value.replace(/\D/g, "") || "0")
}

export function FormDeposito({
  onClose,
  onSuccess,
}: FormDepositoProps) {
  const router = useRouter()

  const [step, setStep] =
    React.useState<DepositStep>("form")

  const [loading, setLoading] = React.useState(false)

  const [checkingPayment, setCheckingPayment] =
    React.useState(false)

  const [deposit, setDeposit] =
    React.useState<DepositData | null>(null)

  const confirmedRef = React.useRef(false)
  const checkingRef = React.useRef(false)

  const form = useForm<FormSchemaDeposito>({
    resolver: zodResolver(formSchemaDeposito),
    defaultValues: {
      valor: 1000,
      withOffer: false,
    },
    mode: "onChange",
  })

  const valor = form.watch("valor")
  const withOffer = form.watch("withOffer")

  const isValidAmount =
    Number.isInteger(valor) &&
    valor >= 1000 &&
    valor <= 1000000

  // =====================================================
  // CONSULTAR STATUS DO DEPÓSITO
  // =====================================================

  const checkPayment = React.useCallback(async () => {
    if (
      !deposit?.id ||
      confirmedRef.current ||
      checkingRef.current
    ) {
      return false
    }

    checkingRef.current = true

    try {
      const response = await fetch(
        `/api/payments/deposit/${encodeURIComponent(
          deposit.id
        )}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        }
      )

      if (!response.ok) {
        return false
      }

      const result: DepositStatusResponse =
        await response.json()

      if (
        result.success &&
        result.deposit?.status === "PAID" &&
        result.deposit.credited
      ) {
        if (confirmedRef.current) return true

        confirmedRef.current = true

        setStep("success")

        notifyGameWalletUpdated()
        router.refresh()

        toast.success("Pagamento confirmado!", {
          description: "Seu saldo foi atualizado.",
        })

        onSuccess?.()

        return true
      }

      return false
    } catch (error) {
      console.error("[CHECK_PAYMENT]", error)

      return false
    } finally {
      checkingRef.current = false
    }
  }, [deposit?.id, router, onSuccess])

  // =====================================================
  // VERIFICAÇÃO AUTOMÁTICA
  // =====================================================

  React.useEffect(() => {
    if (step !== "pix" || !deposit?.id) return

    void checkPayment()

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void checkPayment()
      }
    }, 5000)

    return () => {
      window.clearInterval(interval)
    }
  }, [step, deposit?.id, checkPayment])

  // =====================================================
  // GERAR PIX
  // =====================================================

  async function onSubmit(data: FormSchemaDeposito) {
    if (loading) return

    setLoading(true)

    try {
      const response = await fetch(
        "/api/payments/deposit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({
            amount: data.valor,
          }),
        }
      )

      const result: DepositResponse =
        await response.json()

      if (
        !response.ok ||
        !result.success ||
        !result.deposit
      ) {
        toast.error(
          result.error ||
            "Não foi possível gerar o Pix."
        )

        return
      }

      confirmedRef.current = false

      setDeposit(result.deposit)

      if (
        result.mode === "PIX" &&
        result.deposit.pixCopyPaste
      ) {
        setStep("pix")

        toast.success("Pix gerado com sucesso!")
      } else {
        setStep("preview")

        toast.info("Solicitação registrada.")
      }

      router.refresh()
    } catch (error) {
      console.error("[CREATE_DEPOSIT]", error)

      toast.error("Erro ao preparar o depósito.")
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // VERIFICAR MANUALMENTE
  // =====================================================

  async function handleCheckPayment() {
    if (checkingPayment) return

    setCheckingPayment(true)

    try {
      const confirmed = await checkPayment()

      if (!confirmed) {
        toast.info(
          "Ainda estamos aguardando a confirmação do pagamento."
        )
      }
    } finally {
      setCheckingPayment(false)
    }
  }

  // =====================================================
  // PAGAMENTO CONFIRMADO
  // =====================================================

  if (step === "success" && deposit) {
    return (
      <PaymentSuccess
        amount={deposit.amount}
        onClose={onClose}
      />
    )
  }

  // =====================================================
  // PIX
  // =====================================================

  if (
    step === "pix" &&
    deposit?.pixCopyPaste
  ) {
    return (
      <PixPayment
        amount={deposit.amount}
        pixCopyPaste={deposit.pixCopyPaste}
        expiresAt={deposit.expiresAt}
        checkingPayment={checkingPayment}
        onBack={onClose}
        onCheckPayment={handleCheckPayment}
      />
    )
  }

  // =====================================================
  // PREVIEW
  // =====================================================

  if (step === "preview" && deposit) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center py-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-400/10">
          <Clock3 className="size-8 text-amber-300" />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-white">
          Solicitação registrada
        </h2>

        <p className="mt-3 text-sm text-white/50">
          Sua solicitação foi registrada, mas nenhum
          código Pix foi disponibilizado.
        </p>

        <p className="mt-6 text-3xl font-bold text-white">
          {formatCurrency(deposit.amount)}
        </p>

        <Button
          type="button"
          onClick={onClose}
          className="mt-8 h-12 w-full rounded-xl bg-[#C8F31D] font-bold text-[#101510]"
        >
          Voltar para carteira
        </Button>
      </div>
    )
  }

  // =====================================================
  // FORMULÁRIO
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-md pb-3">
      <div className="mb-6">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-[#C8F31D]/15 bg-[#C8F31D]/10">
          <Wallet className="size-6 text-[#C8F31D]" />
        </div>

        <h2 className="mt-5 text-2xl font-bold tracking-tight text-white">
          Adicionar saldo
        </h2>

        <p className="mt-2 text-sm text-white/50">
          Escolha o valor que deseja depositar via Pix.
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <FieldGroup className="gap-5">
          {/* VALORES PREDEFINIDOS */}

          <Controller
            name="valor"
            control={form.control}
            render={({ field }) => (
              <DepositoValores
                value={field.value}
                onChange={field.onChange}
                withOffer={withOffer}
                disabled={loading}
              />
            )}
          />

          {/* VALOR PERSONALIZADO */}

          <Controller
            name="valor"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor="deposito-valor"
                  className="text-sm font-medium text-white"
                >
                  Ou digite outro valor
                </FieldLabel>

                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-white/40">
                    R$
                  </span>

                  <Input
                    id="deposito-valor"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    disabled={loading}
                    aria-invalid={fieldState.invalid}
                    value={(field.value / 100).toLocaleString(
                      "pt-BR",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                    onChange={(event) => {
                      field.onChange(
                        parseCurrency(event.target.value)
                      )
                    }}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    className="h-12 rounded-xl border-white/10 bg-[#171C19] pl-11 text-base text-white"
                  />
                </div>

                <p className="mt-2 text-xs text-white/40">
                  Mínimo R$ 10,00 · Máximo R$ 10.000,00
                </p>

                {fieldState.invalid && (
                  <FieldError
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />

          {/* RESUMO */}

          <div className="rounded-2xl border border-white/10 bg-[#171C19] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-white/50">
                Valor do depósito
              </span>

              <span className="text-sm font-semibold text-white">
                {formatCurrency(valor)}
              </span>
            </div>

            <div className="my-4 h-px bg-white/[0.07]" />

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white">
                Total
              </span>

              <span className="text-xl font-bold text-[#C8F31D]">
                {formatCurrency(valor)}
              </span>
            </div>
          </div>

          {/* SUBMIT */}

          <Button
            type="submit"
            isDisabled={loading || !isValidAmount}
            className="h-12 w-full rounded-xl bg-[#C8F31D] text-sm font-bold text-[#101510] hover:bg-[#B8E31A]"
          >
            {loading ? (
              <>
                <LoaderCircle className="mr-2 size-4 animate-spin" />
                Gerando Pix...
              </>
            ) : (
              <>
                Continuar com {formatCurrency(valor)}
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>

          <p className="flex items-center justify-center gap-2 text-center text-[11px] leading-relaxed text-white/40">
            <ShieldCheck className="size-3.5 shrink-0 text-[#C8F31D]" />
            O saldo será atualizado após a confirmação do Pix.
          </p>
        </FieldGroup>
      </form>
    </div>
  )
}