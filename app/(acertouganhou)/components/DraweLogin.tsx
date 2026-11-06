"use client"

import * as React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { FormEntrar } from "./form/formentrar"
import { CircleX } from "lucide-react"
import { useIsMobile } from "@/hooks/useIsMobile"

export function DrawerLogin() {
  const isMobile = useIsMobile()

  const [open, setOpen] = useState(false)

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
            variant="outline"
            className="px-2 w-18 rounded-2xl text-xs"
          >
            ENTRAR
          </Button>
        }
      />

      <DrawerContent className="dark">
        <DrawerHeader className="flex items-start">
          <DrawerClose className="flex w-full items-end justify-end">
            <CircleX />
          </DrawerClose>

          <DrawerTitle className="text-2xl font-semibold">
            Bem-vindo de volta
          </DrawerTitle>

          <DrawerDescription>
            Entre na sua conta para jogar.
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4">
          <FormEntrar onClose={() => setOpen(false)} />
        </div>

        <DrawerFooter className="text-center mt-8 space-y-6">
          <span className="text-lime-500">
            Esqueci minha senha
          </span>

          <span className="flex items-center justify-center gap-2">
            Ainda não tem conta?
            <p className="text-lime-500">Cadastre-se</p>
          </span>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}