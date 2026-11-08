"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
  ArrowRight,
  CheckCircle2,
  Wallet,
  LoaderCircle,
  ShieldCheck,
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

import { addDemoBalance } from "./actions/wallet/add-demo-balance"

// ======================================================
// TYPES
// ======================================================

interface FormDepositoProps {
  onClose: () => void
  onSuccess?: () => void
}

// ======================================================
// HELPERS
// ======================================================

function formatCurrency(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function parseCurrency(value: string) {
  const digits = value.replace(/\D/g, "")

  return Number(digits || "0")
}

// ======================================================
// COMPONENT
// ======================================================

export function FormDeposito({
  onClose,
  onSuccess,
}: FormDepositoProps) {
  const router = useRouter()

  const [loading, setLoading] = React.useState(false)

  const form = useForm<FormSchemaDeposito>({
    resolver: zodResolver(formSchemaDeposito),

    defaultValues: {
      valor: 10000,
      withOffer: false,
    },

    mode: "onChange",
  })

  // ======================================================
  // FORM VALUES
  // ======================================================

  const valor = form.watch("valor")
  const withOffer = form.watch("withOffer")

  const isValidAmount =
    Number.isInteger(valor) &&
    valor >= 1000 &&
    valor <= 1000000

  // ======================================================
  // SUBMIT
  // ======================================================

  async function onSubmit(data: FormSchemaDeposito) {
    if (loading) return

    try {
      setLoading(true)

      // Adiciona créditos fictícios no banco de dados
      const result = await addDemoBalance(data.valor)

      if (!result.success) {
        toast.error(result.error || "Erro ao adicionar saldo.")
        return
      }

      // Notificação
      toast.success("Saldo demo adicionado!", {
        description: `${formatCurrency(
          data.valor
        )} adicionados à sua carteira fictícia.`,
        duration: 4000,
      })

      // Limpa o formulário
      form.reset({
        valor: 10000,
        withOffer: false,
      })

      // Atualiza os Server Components
      router.refresh()

      // Atualiza o saldo no Header
      onSuccess?.()

      // Fecha o Dialog
      onClose()
    } catch (error) {
      console.error("Erro ao adicionar saldo demo:", error)

      toast.error("Não foi possível adicionar saldo.", {
        description: "Tente novamente em alguns instantes.",
      })
    } finally {
      setLoading(false)
    }
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="w-full max-w-lg">
      {/* HEADER */}
      <div className="mb-6 space-y-2">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#C8F31D]/10 text-[#C8F31D]">
          <Wallet className="size-6" />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Adicionar saldo
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-white/50">
            Escolha um valor para adicionar créditos à sua carteira
            de demonstração.
          </p>
        </div>
      </div>

      {/* DEMO BADGE */}
      

      {/* FORM */}
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-6">
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
                      const parsed = parseCurrency(
                        event.target.value
                      )

                      field.onChange(parsed)
                    }}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    className="
                      h-13
                      rounded-xl
                      border-white/10
                      bg-[#171C19]
                      pl-11
                      text-base
                      font-medium
                      text-white
                      placeholder:text-white/30
                      focus-visible:border-[#C8F31D]
                      focus-visible:ring-[#C8F31D]/20
                    "
                  />
                </div>

                <p className="mt-2 text-xs text-white/40">
                  Mínimo R$ 10,00 · Máximo R$ 10.000,00
                </p>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* RESUMO */}
          

          {/* BOTÃO */}
          <Button
            type="submit"
            isDisabled={loading || !isValidAmount}
            className="
              h-13
              w-full
              rounded-xl
              bg-[#C8F31D]
              text-sm
              font-bold
              text-[#101510]
              transition-all
              hover:bg-[#B8E31A]
              active:scale-[0.98]
              disabled:opacity-50
            "
          >
            {loading ? (
              <>
                <LoaderCircle className="mr-2 size-5 animate-spin" />
                Adicionando créditos...
              </>
            ) : (
              <>
                Adicionar {formatCurrency(valor)}
                <ArrowRight className="ml-2 size-5" />
              </>
            )}
          </Button>

          {/* FOOTER */}
          <p className="text-center text-[11px] leading-relaxed text-white/30">
            Os créditos de demonstração não podem ser sacados,
            transferidos ou convertidos em dinheiro real.
          </p>
        </FieldGroup>
      </form>
    </div>
  )
}