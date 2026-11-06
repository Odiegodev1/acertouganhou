"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
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
import { cn } from "cn"
import { FormCadastro } from "./form/formCadastro"

export function DraweCadastro() {

  

  return (
    <Drawer >
    <DrawerTrigger render={   <Button
          className={cn(
            "h-9 w-22 rounded-2xl px-4",
            "bg-[#c8f31d] text-[#101409]",
            "text-xs font-bold",
            "transition-colors duration-200",
            "hover:bg-[#d6ff45]",
            "sm:h-10 sm:px-5 sm:text-sm"
          )}
        >
        
          Criar Conta
        </Button>}></DrawerTrigger>
    <DrawerContent className="dark ">
      <DrawerHeader className="flex items-start">
      <DrawerClose className="flex w-full items-end justify-end" ><CircleX /></DrawerClose>
        <DrawerTitle className="text-2xl font-semibold">Crie sua conta</DrawerTitle>
        <DrawerDescription>Depósitos e saques via Pix.</DrawerDescription>
        
      </DrawerHeader>
      <div className="p-4 ">
        <FormCadastro />
      </div>
      
    </DrawerContent>
  </Drawer>
  )
}
