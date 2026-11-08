"use client"

import * as React from "react"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { Wallet, Plus, LoaderCircle } from "lucide-react"

import { useIsMobile } from "@/hooks/useIsMobile"
import { FormDeposito } from "./form/formdeposito"
import { getWallet } from "./form/actions/wallet/get-wallet"

interface DialogDepositoProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

function formatCurrency(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function DialogDeposito({
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: DialogDepositoProps) {
  const isMobile = useIsMobile()

  const [internalOpen, setInternalOpen] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setInternalOpen(value)
      }

      onOpenChange?.(value)
    },
    [isControlled, onOpenChange]
  )

  const loadBalance = useCallback(async () => {
    try {
      setLoading(true)

      const result = await getWallet()

      if (result.success) {
        setBalance(result.balance)
      } else {
        setBalance(null)
      }
    } catch (error) {
      console.error("Erro ao carregar carteira:", error)
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBalance()
  }, [loadBalance])

  useEffect(() => {
    if (!open) return

    void loadBalance()
  }, [open, loadBalance])

  const handleSuccess = async () => {
    await loadBalance()
    onSuccess?.()
    setOpen(false)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      {/* BOTÃO DO SALDO */}
      <DrawerTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="
              flex h-10 items-center gap-2
              rounded-full border border-white/10
              bg-[#171C19] px-3
              text-white
              transition-all
              hover:border-[#C8F31D]/30
              hover:bg-[#202820]
              sm:px-4
            "
          >
            <Wallet className="size-4 shrink-0 text-[#C8F31D]" />

            {loading ? (
              <LoaderCircle className="size-4 animate-spin text-white/50" />
            ) : (
              <span className="whitespace-nowrap text-xs font-bold sm:text-sm">
                {balance === null ? "R$ —" : formatCurrency(balance)}
              </span>
            )}

            <span className="flex size-5 items-center justify-center rounded-full bg-[#C8F31D] text-[#101510]">
              <Plus className="size-3.5" />
            </span>
          </Button>
        }
      />

      {/* CONTEÚDO DO DRAWER */}
      <DrawerContent
        className="
          dark
          max-h-[95dvh]
          overflow-y-auto
          border-white/10
          bg-[#101510]
          text-white
        "
      >
        <DrawerHeader className="sr-only">
          <DrawerTitle>Adicionar saldo demo</DrawerTitle>

          <DrawerDescription>
            Adicione créditos fictícios à sua carteira.
          </DrawerDescription>
        </DrawerHeader>

        <div className="w-full p-4 sm:p-6">
          <FormDeposito
            onClose={() => setOpen(false)}
            onSuccess={handleSuccess}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}