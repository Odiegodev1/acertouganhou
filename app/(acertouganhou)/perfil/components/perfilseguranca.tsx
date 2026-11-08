"use client"

import { useState } from "react"
import { toast } from "sonner"

import {
  Eye,
  EyeOff,
  LockKeyhole,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PerfilSegurancaProps {
  onChangePassword?: (data: {
    currentPassword: string
    newPassword: string
  }) => Promise<void>
}

export function PerfilSeguranca({
  onChangePassword,
}: PerfilSegurancaProps) {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!currentPassword) {
      toast.error("Informe sua senha atual.")
      return
    }

    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.")
      return
    }

    if (currentPassword === newPassword) {
      toast.error("A nova senha deve ser diferente da atual.")
      return
    }

    if (!onChangePassword) {
      toast.info("A alteração de senha ainda não está conectada ao banco.")
      return
    }

    try {
      setLoading(true)

      await onChangePassword({
        currentPassword,
        newPassword,
      })

      toast.success("Senha alterada com sucesso!")

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      toast.error("Não foi possível alterar sua senha.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#111612] p-5 sm:p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
          <LockKeyhole className="size-5 text-[#C8F31D]" />
        </div>

        <div>
          <h2 className="text-base font-bold text-white">
            Segurança e senha
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Mantenha sua conta protegida com uma senha segura.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {[
          {
            id: "current-password",
            label: "Senha atual",
            value: currentPassword,
            onChange: setCurrentPassword,
            visible: showCurrent,
            toggle: () => setShowCurrent(!showCurrent),
            autoComplete: "current-password",
          },
          {
            id: "new-password",
            label: "Nova senha",
            value: newPassword,
            onChange: setNewPassword,
            visible: showNew,
            toggle: () => setShowNew(!showNew),
            autoComplete: "new-password",
          },
          {
            id: "confirm-password",
            label: "Confirmar nova senha",
            value: confirmPassword,
            onChange: setConfirmPassword,
            visible: showConfirm,
            toggle: () => setShowConfirm(!showConfirm),
            autoComplete: "new-password",
          },
        ].map((field) => (
          <div key={field.id}>
            <label
              htmlFor={field.id}
              className="mb-2 block text-xs font-medium text-zinc-300"
            >
              {field.label}
            </label>

            <div className="relative">
              <Input
                id={field.id}
                type={field.visible ? "text" : "password"}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                autoComplete={field.autoComplete}
                className="h-12 rounded-xl border-white/10 bg-[#090c0a] px-4 pr-12 text-white focus-visible:border-[#C8F31D]"
              />

              <button
                type="button"
                onClick={field.toggle}
                aria-label={field.visible ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-white"
              >
                {field.visible ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#C8F31D]" />

          <p className="text-xs leading-relaxed text-zinc-500">
            Utilize uma senha exclusiva, com pelo menos 8 caracteres.
            Evite reutilizar senhas de outros serviços.
          </p>
        </div>

        <div className="flex justify-end border-t border-white/[0.06] pt-5">
          <Button
            type="submit"
            isDisabled={loading}
            className="h-11 rounded-xl bg-[#C8F31D] px-5 font-bold text-[#101510] hover:bg-[#B8E31A]"
          >
            {loading && (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            )}

            Alterar senha
          </Button>
        </div>
      </form>
    </section>
  )
}