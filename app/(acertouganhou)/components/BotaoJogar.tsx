"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import type { StaticImageData } from "next/image"

import { Gamepad2, LoaderCircle } from "lucide-react"

interface BotaoJogarProps {
  id: string
  nome: string
  tipo: string
  valor: number
  time: number
  img?: StaticImageData
}

const DialogJogo = dynamic(
  () =>
    import("./DialogJogo").then((module) => module.DialogJogo),
  {
    ssr: false,
    loading: () => null,
  }
)

export function BotaoJogar({
  id,
  nome,
  tipo,
  valor,
  time,
  img,
}: BotaoJogarProps) {
  const [mostrarDialog, setMostrarDialog] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setMostrarDialog(true)}
        className="
          flex h-11 w-full items-center justify-center gap-2
          rounded-xl bg-[#c8f31d]
          text-sm font-bold text-[#101510]
          transition-all duration-200
          hover:bg-[#d9ff53]
          active:scale-[0.98]
        "
      >
        <Gamepad2 className="size-4" />
      
      </button>

      {mostrarDialog && (
        <DialogJogo
          id={id}
          nome={nome}
          tipo={tipo}
          valor={valor}
          time={time}
          img={img}
        />
      )}
    </>
  )
}