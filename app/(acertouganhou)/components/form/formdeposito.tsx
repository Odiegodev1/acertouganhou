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

// ==========================================
// TYPES
// ==========================================

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

// ==========================================
// HELPERS
// ==========================================

function formatCurrency(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function parseCurrency(value: string) {
  return Number(value.replace(/\D/g, "") || "0")
}

// ==========================================
// COMPONENT
// ==========================================

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

  // ==========================================
  // FORM
  // ==========================================

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

  // ==========================================
  // CONSULTAR STATUS DO DEPÓSITO
  // ==========================================

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
        result.deposit.credited === true
      ) {
        if (confirmedRef.current) {
          return true
        }

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

  // ==========================================
  // VERIFICAÇÃO AUTOMÁTICA DO PIX
  // ==========================================

  React.useEffect(() => {
    if (step !== "pix" || !deposit?.id) {
      return
    }

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

  // ==========================================
  // GERAR PIX
  // ==========================================

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

      const responseText = await response.text()

      let result: DepositResponse

      try {
        if (!responseText.trim()) {
          throw new Error("Resposta vazia")
        }

        result = JSON.parse(
          responseText
        ) as DepositResponse
      } catch {
        toast.error(
          `O servidor retornou uma resposta inválida (HTTP ${response.status}).`
        )
        return
      }

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

      toast.error(
        "Não foi possível conectar ao servidor. Tente novamente mais tarde."
      )
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // VERIFICAR PAGAMENTO MANUALMENTE
  // ==========================================

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

  // ==========================================
  // PAGAMENTO CONFIRMADO
  // ==========================================

  if (step === "success" && deposit) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-md overflow-x-hidden px-1 py-3 sm:px-2 sm:py-6">
        <PaymentSuccess
          amount={deposit.amount}
          onClose={onClose}
        />
      </div>
    )
  }

  // ==========================================
  // TELA PIX
  // ==========================================

  if (
    step === "pix" &&
    deposit?.pixCopyPaste
  ) {
    return (
      <div
        className="
          mx-auto
          w-full
          min-w-0
          max-w-md
          overflow-x-hidden
          px-1
          py-2
          sm:px-2
          sm:py-5
        "
      >
        <PixPayment
          amount={deposit.amount}
          pixCopyPaste={deposit.pixCopyPaste}
          expiresAt={deposit.expiresAt}
          checkingPayment={checkingPayment}
          onBack={onClose}
          onCheckPayment={handleCheckPayment}
        />
      </div>
    )
  }

  // ==========================================
  // PREVIEW
  // ==========================================

  if (step === "preview" && deposit) {
    return (
      <div
        className="
          mx-auto
          flex
          w-full
          min-w-0
          max-w-md
          flex-col
          items-center
          px-2
          py-6
          text-center
          sm:px-4
          sm:py-10
        "
      >
        <div
          className="
            flex
            size-14
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-amber-400/10
            sm:size-16
          "
        >
          <Clock3 className="size-7 text-amber-300 sm:size-8" />
        </div>

        <h2
          className="
            mt-5
            text-xl
            font-bold
            tracking-tight
            text-white
            sm:text-2xl
          "
        >
          Solicitação registrada
        </h2>

        <p
          className="
            mt-3
            max-w-sm
            text-xs
            leading-relaxed
            text-white/50
            sm:text-sm
          "
        >
          Sua solicitação foi registrada, mas nenhum
          código Pix foi disponibilizado.
        </p>

        <p
          className="
            mt-6
            text-2xl
            font-bold
            text-white
            sm:text-3xl
          "
        >
          {formatCurrency(deposit.amount)}
        </p>

        <Button
          type="button"
          onClick={onClose}
          className="
            mt-8
            h-12
            w-full
            rounded-xl
            bg-[#C8F31D]
            px-4
            text-sm
            font-bold
            text-[#101510]
            hover:bg-[#B8E31A]
          "
        >
          Voltar para carteira
        </Button>
      </div>
    )
  }

  // ==========================================
  // FORMULÁRIO DE DEPÓSITO
  // ==========================================

  return (
    <div
      className="
        mx-auto
        flex
        w-full
        min-w-0
        max-w-md
        flex-col
        overflow-x-hidden
        px-1
        pb-4
        sm:px-2
        sm:pb-6
      "
    >
      {/* HEADER */}

      <div className="mb-5 sm:mb-7">
        <div
          className="
            flex
            size-11
            shrink-0
            items-center
            justify-center
            rounded-2xl
            border
            border-[#C8F31D]/15
            bg-[#C8F31D]/10
            sm:size-12
          "
        >
          <Wallet className="size-5 text-[#C8F31D] sm:size-6" />
        </div>

        <h2
          className="
            mt-4
            text-xl
            font-bold
            tracking-tight
            text-white
            sm:mt-5
            sm:text-2xl
          "
        >
          Adicionar saldo
        </h2>

        <p
          className="
            mt-2
            text-xs
            leading-relaxed
            text-white/50
            sm:text-sm
          "
        >
          Escolha o valor que deseja depositar via Pix.
        </p>
      </div>

      {/* FORM */}

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="w-full min-w-0"
      >
        <FieldGroup className="w-full min-w-0 gap-5">
          {/* VALORES PREDEFINIDOS */}

          <div className="w-full min-w-0">
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
          </div>

          {/* VALOR PERSONALIZADO */}

          <Controller
            name="valor"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className="w-full min-w-0"
              >
                <FieldLabel
                  htmlFor="deposito-valor"
                  className="text-xs font-medium text-white sm:text-sm"
                >
                  Ou digite outro valor
                </FieldLabel>

                <div className="relative w-full min-w-0">
                  <span
                    className="
                      pointer-events-none
                      absolute
                      inset-y-0
                      left-4
                      flex
                      items-center
                      text-sm
                      font-medium
                      text-white/40
                    "
                  >
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
                    className="
                      h-12
                      w-full
                      min-w-0
                      rounded-xl
                      border-white/10
                      bg-[#171C19]
                      pl-11
                      text-base
                      text-white
                      sm:h-13
                    "
                  />
                </div>

                <p
                  className="
                    mt-2
                    text-[11px]
                    leading-relaxed
                    text-white/40
                    sm:text-xs
                  "
                >
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

          <div
            className="
              w-full
              min-w-0
              rounded-2xl
              border
              border-white/10
              bg-[#171C19]
              p-3
              sm:p-4
            "
          >
            <div
              className="
                flex
                min-w-0
                items-center
                justify-between
                gap-3
              "
            >
              <span className="text-xs text-white/50 sm:text-sm">
                Valor do depósito
              </span>

              <span
                className="
                  shrink-0
                  text-xs
                  font-semibold
                  text-white
                  sm:text-sm
                "
              >
                {formatCurrency(valor)}
              </span>
            </div>

            <div className="my-4 h-px bg-white/[0.07]" />

            <div
              className="
                flex
                min-w-0
                items-center
                justify-between
                gap-3
              "
            >
              <span className="text-xs font-semibold text-white sm:text-sm">
                Total
              </span>

              <span
                className="
                  shrink-0
                  text-lg
                  font-bold
                  text-[#C8F31D]
                  sm:text-xl
                "
              >
                {formatCurrency(valor)}
              </span>
            </div>
          </div>

          {/* SUBMIT */}

          <Button
            type="submit"
            isDisabled={loading || !isValidAmount}
            className="
              flex
              h-12
              w-full
              min-w-0
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[#C8F31D]
              px-3
              text-xs
              font-bold
              text-[#101510]
              transition-colors
              hover:bg-[#B8E31A]
              sm:h-13
              sm:text-sm
            "
          >
            {loading ? (
              <>
                <LoaderCircle className="size-4 shrink-0 animate-spin" />
                <span>Gerando Pix...</span>
              </>
            ) : (
              <>
                <span className="min-w-0 truncate">
                  Continuar com {formatCurrency(valor)}
                </span>

                <ArrowRight className="size-4 shrink-0" />
              </>
            )}
          </Button>

          {/* SEGURANÇA */}

          <p
            className="
              flex
              items-start
              justify-center
              gap-2
              px-1
              text-center
              text-[10px]
              leading-relaxed
              text-white/40
              sm:items-center
              sm:text-[11px]
            "
          >
            <ShieldCheck
              className="
                mt-0.5
                size-3.5
                shrink-0
                text-[#C8F31D]
                sm:mt-0
              "
            />

            <span>
              O saldo será atualizado após a confirmação do Pix.
            </span>
          </p>
        </FieldGroup>
      </form>
    </div>
  )
}