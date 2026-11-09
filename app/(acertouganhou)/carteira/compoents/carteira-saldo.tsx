"use client"

import * as React from "react"



import {
  GAME_WALLET_UPDATED,
} from "@/lib/game/wallet-events"
import { getGameWalletBalance } from "../../components/form/actions/wallet/get-game"

interface CarteiraSaldoProps {
  initialBalance: number
}

function formatCredits(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function CarteiraSaldo({
  initialBalance,
}: CarteiraSaldoProps) {
  const [balance, setBalance] = React.useState(initialBalance)

  const requestIdRef = React.useRef(0)

  const loadBalance = React.useCallback(async () => {
    const requestId = ++requestIdRef.current

    try {
      const result = await getGameWalletBalance()

      if (requestId !== requestIdRef.current) {
        return
      }

      if (result.success) {
        setBalance(result.balance)
      }
    } catch (error) {
      console.error("[CARTEIRA_SALDO]", error)
    }
  }, [])

  React.useEffect(() => {
    void loadBalance()

    const handleWalletUpdated = () => {
      void loadBalance()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadBalance()
      }
    }

    const handleFocus = () => {
      void loadBalance()
    }

    window.addEventListener(
      GAME_WALLET_UPDATED,
      handleWalletUpdated
    )

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    )

    window.addEventListener("focus", handleFocus)

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadBalance()
      }
    }, 15000)

    return () => {
      requestIdRef.current += 1

      window.removeEventListener(
        GAME_WALLET_UPDATED,
        handleWalletUpdated
      )

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      )

      window.removeEventListener("focus", handleFocus)

      window.clearInterval(interval)
    }
  }, [loadBalance])

  return (
    <div aria-live="polite">
      <h2 className="break-all text-[42px] font-bold leading-none tracking-[-0.05em] text-white md:text-5xl">
        {formatCredits(balance)}
        
      </h2>
    </div>
  )
}