"use client"

import * as React from "react"

import {
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

import { useIsMobile } from "@/hooks/useIsMobile"
import { FormDeposito } from "../../components/form/formdeposito"

// Ajuste este import se o FormDeposito estiver em outra pasta.


export function CarteiraActions() {
  const isMobile = useIsMobile()

  const [depositOpen, setDepositOpen] = React.useState(false)
  const [withdrawOpen, setWithdrawOpen] = React.useState(false)

  return (
    <>
      <div className="grid w-full grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={() => setDepositOpen(true)}
          className="
            h-12 w-full rounded-xl
            bg-[#C8F31D]
            text-sm font-bold text-[#101510]
            transition-all
            hover:bg-[#B8E31A]
            active:scale-[0.98]
          "
        >
          <ArrowDownLeft className="mr-2 size-4" />
          Depositar
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setWithdrawOpen(true)}
          className="
            h-12 w-full rounded-xl
            border-white/10 bg-white/[0.04]
            text-sm font-semibold text-white
            transition-all
            hover:border-white/20
            hover:bg-white/[0.08]
          "
        >
          <ArrowUpRight className="mr-2 size-4" />
          Sacar
        </Button>
      </div>

      {/* DRAWER DE DEPÓSITO */}

      <Drawer
        open={depositOpen}
        onOpenChange={setDepositOpen}
        showSwipeHandle={isMobile}
        swipeDirection={isMobile ? "down" : "right"}
      >
        <DrawerContent
          className="
            dark max-h-[95dvh]
            overflow-y-auto
            border-white/10
            bg-[#101510] text-white
          "
        >
          <DrawerHeader className="sr-only">
            <DrawerTitle>Depositar via Pix</DrawerTitle>
            <DrawerDescription>
              Preparar uma solicitação de depósito.
            </DrawerDescription>
          </DrawerHeader>

          <div className="w-full p-4 sm:p-6">
            <FormDeposito
              onClose={() => setDepositOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* DRAWER DE SAQUE */}

      <Drawer
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        showSwipeHandle={isMobile}
        swipeDirection={isMobile ? "down" : "right"}
      >
        <DrawerContent
          className="
            dark max-h-[95dvh]
            border-white/10
            bg-[#101510] text-white
          "
        >
          <DrawerHeader className="sr-only">
            <DrawerTitle>Saque Pix</DrawerTitle>
            <DrawerDescription>
              Informações sobre a disponibilidade dos saques.
            </DrawerDescription>
          </DrawerHeader>

          <div className="mx-auto w-full max-w-lg p-6 text-center sm:p-8">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#C8F31D]/10">
              <ShieldCheck className="size-8 text-[#C8F31D]" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-white">
              Saques em preparação
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-white/50">
              Estamos preparando a integração de saques Pix.
              Transferências financeiras ainda não estão disponíveis.
            </p>

            <Button
              type="button"
              onClick={() => setWithdrawOpen(false)}
              className="mt-7 h-12 w-full rounded-xl bg-[#C8F31D] font-bold text-[#101510] hover:bg-[#B8E31A]"
            >
              Entendi
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}