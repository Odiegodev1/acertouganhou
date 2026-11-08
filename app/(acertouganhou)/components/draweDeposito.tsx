"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import {
  Wallet,
  Plus,
  LoaderCircle,
} from "lucide-react"

import { useIsMobile } from "@/hooks/useIsMobile"

import { FormDeposito } from "./form/formdeposito"

import { getWallet } from "./form/actions/wallet/get-wallet"

import {
  WALLET_UPDATED_EVENT,
  notifyWalletUpdated,
} from "@/lib/wallet-events"

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

  const [internalOpen, setInternalOpen] = React.useState(false)

  const [balance, setBalance] = React.useState<number | null>(null)

  const [loading, setLoading] = React.useState(true)

  const isControlled = controlledOpen !== undefined

  const open = isControlled ? controlledOpen : internalOpen

  // Evita que uma resposta antiga sobrescreva
  // uma consulta mais recente.
  const requestIdRef = React.useRef(0)

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setInternalOpen(value)
      }

      onOpenChange?.(value)
    },
    [isControlled, onOpenChange]
  )

  const loadBalance = React.useCallback(async () => {
    const requestId = ++requestIdRef.current

    try {
      const result = await getWallet()

      if (requestId !== requestIdRef.current) return

      if (result.success) {
        setBalance(result.balance)
      } else {
        setBalance(null)
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return

      console.error("Erro ao carregar carteira:", error)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  // Carregamento inicial.
  React.useEffect(() => {
    void loadBalance()

    return () => {
      requestIdRef.current += 1
    }
  }, [loadBalance])

  // Atualiza quando abrir o Drawer.
  React.useEffect(() => {
    if (!open) return

    void loadBalance()
  }, [open, loadBalance])

  // Atualiza após depósitos, jogos e outras movimentações.
  React.useEffect(() => {
    const handleWalletUpdated = () => {
      void loadBalance()
    }

    window.addEventListener(
      WALLET_UPDATED_EVENT,
      handleWalletUpdated
    )

    return () => {
      window.removeEventListener(
        WALLET_UPDATED_EVENT,
        handleWalletUpdated
      )
    }
  }, [loadBalance])

  // Atualiza ao voltar para a aba.
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadBalance()
      }
    }

    const handleFocus = () => {
      void loadBalance()
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    )

    window.addEventListener("focus", handleFocus)

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      )

      window.removeEventListener("focus", handleFocus)
    }
  }, [loadBalance])

  const handleSuccess = React.useCallback(async () => {
    // Notifica outros componentes que utilizam a carteira.
    notifyWalletUpdated()

    // Atualiza também este botão.
    await loadBalance()

    onSuccess?.()

    setOpen(false)
  }, [loadBalance, onSuccess, setOpen])

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
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
                {balance === null
                  ? "R$ —"
                  : formatCurrency(balance)}
              </span>
            )}

            <span className="flex size-5 items-center justify-center rounded-full bg-[#C8F31D] text-[#101510]">
              <Plus className="size-3.5" />
            </span>
          </Button>
        }
      />

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
          <DrawerTitle>
            Adicionar saldo demo
          </DrawerTitle>

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