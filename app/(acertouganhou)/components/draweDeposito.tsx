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

import { Wallet, Plus, LoaderCircle } from "lucide-react"

import { useIsMobile } from "@/hooks/useIsMobile"
import { FormDeposito } from "./form/formdeposito"


import {
  GAME_WALLET_UPDATED,
  notifyGameWalletUpdated,
} from "@/lib/game/wallet-events"
import { getGameWalletBalance } from "./form/actions/wallet/get-game"


interface DialogDepositoProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

function formatCredits(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

  // ==========================================
  // CONSULTAR SALDO DO JOGO
  // ==========================================

  const loadBalance = React.useCallback(async () => {
    const requestId = ++requestIdRef.current

    try {
      const result = await getGameWalletBalance()

      if (requestId !== requestIdRef.current) return

      if (result.success) {
        setBalance(result.balance)
      } else {
        setBalance(null)
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return

      console.error("[GAME_BALANCE]", error)
      setBalance(null)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  // ==========================================
  // CARREGAMENTO INICIAL
  // ==========================================

  React.useEffect(() => {
    void loadBalance()

    return () => {
      requestIdRef.current += 1
    }
  }, [loadBalance])

  // ==========================================
  // ATUALIZAR AO ABRIR
  // ==========================================

  React.useEffect(() => {
    if (!open) return

    void loadBalance()
  }, [open, loadBalance])

  // ==========================================
  // ATUALIZAR DEPOIS DE JOGAR
  // ==========================================

  React.useEffect(() => {
    const handleUpdate = () => {
      void loadBalance()
    }

    window.addEventListener(
      GAME_WALLET_UPDATED,
      handleUpdate
    )

    return () => {
      window.removeEventListener(
        GAME_WALLET_UPDATED,
        handleUpdate
      )
    }
  }, [loadBalance])

  // ==========================================
  // ATUALIZAR AO VOLTAR PARA A ABA
  // ==========================================

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

      window.removeEventListener(
        "focus",
        handleFocus
      )
    }
  }, [loadBalance])

  // ==========================================
  // ATUALIZAÇÃO PERIÓDICA
  // ==========================================

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadBalance()
      }
    }, 15000)

    return () => {
      window.clearInterval(interval)
    }
  }, [loadBalance])

  // ==========================================
  // DEPÓSITO CONFIRMADO
  // ==========================================

  const handleSuccess = React.useCallback(async () => {
    // Atualiza outros componentes que consultam
    // o saldo financeiro real.
    notifyGameWalletUpdated()

    // Atualiza a carteira fictícia exibida aqui.
    // Não transfere dinheiro entre carteiras.
    await loadBalance()

    onSuccess?.()

    // Mantém aberto para exibir o sucesso.
  }, [loadBalance, onSuccess])

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
              text-white transition-all
              hover:border-[#C8F31D]/30
              hover:bg-[#202820]
              sm:px-4
            "
          >
            <Wallet className="size-4 shrink-0 text-[#C8F31D]" />

            {loading && balance === null ? (
              <LoaderCircle className="size-4 animate-spin text-white/50" />
            ) : (
              <span className="whitespace-nowrap text-xs font-bold sm:text-sm">
                {balance === null
                  ? "—"
                  : `${formatCredits(balance)} `}
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
          dark flex max-h-[95dvh] flex-col
          overflow-hidden border-white/10
          bg-[#101510] text-white
        "
      >
        <DrawerHeader className="sr-only">
          <DrawerTitle>Depositar via Pix</DrawerTitle>

          <DrawerDescription>
            Faça um depósito utilizando Pix.
          </DrawerDescription>
        </DrawerHeader>

        <div
          className="
            min-h-0 w-full flex-1
            overflow-x-hidden overflow-y-auto
            overscroll-contain px-4 pt-4
            pb-[max(24px,env(safe-area-inset-bottom))]
            sm:px-6 sm:py-6
          "
        >
          <FormDeposito
            onClose={() => setOpen(false)}
            onSuccess={handleSuccess}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}