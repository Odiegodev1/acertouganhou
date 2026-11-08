"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormDeposito } from "./form/formdeposito"



interface DialogDepositoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DialogDeposito({
  open,
  onOpenChange,
  onSuccess,
}: DialogDepositoProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-24px)] max-w-lg overflow-y-auto rounded-2xl border-white/10 bg-[#0b0f0c] p-5 text-white sm:p-7">
        <DialogHeader className="sr-only">
          <DialogTitle>Adicionar saldo demo</DialogTitle>

          <DialogDescription>
            Adicione créditos fictícios à carteira.
          </DialogDescription>
        </DialogHeader>

        <FormDeposito
          onClose={() => {
            onOpenChange(false)
            onSuccess?.()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}