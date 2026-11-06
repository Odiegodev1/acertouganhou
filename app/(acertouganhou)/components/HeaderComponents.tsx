"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { Bell, ChevronRight, LogIn } from "lucide-react";

import Logo from "@/public/logo.png";
import BadgeIphone from "@/public/badgeiphone.png";
import Badgeplay from "@/public/badgeplay.png";
import Badgetv from "@/public/badgetv.png";
import BadgeDois from "@/public/badgedois.png";
import BadgeMil from "@/public/badgemil.png";
import BadgeCinco from "@/public/Badgecinco.png";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DrawerLogin } from "./DraweLogin";
import { DraweCadastro } from "./Drawecadastro";
import { auth } from "@/lib/auth";
import { DropdownMenuDemo } from "./dropmenuavatar";

type PrizeItem = {
  id: number;
  img: StaticImageData;
  name: string;
  shortName: string;
};

const navItems: PrizeItem[] = [
  {
    id: 1,
    img: BadgeIphone,
    name: "iPhone 17 Pro Max",
    shortName: "iPhone 17",
  },
  {
    id: 2,
    img: Badgetv,
    name: 'Smart TV 55"',
    shortName: "Smart TV",
  },
  {
    id: 3,
    img: Badgeplay,
    name: "PlayStation 5",
    shortName: "PlayStation 5",
  },
  {
    id: 4,
    img: BadgeDois,
    name: "R$ 200,00 no Pix",
    shortName: "R$ 200",
  },
  {
    id: 5,
    img: BadgeMil,
    name: "R$ 1.000,00 no Pix",
    shortName: "R$ 1.000",
  },
  {
    id: 6,
    img: BadgeCinco,
    name: "R$ 5.000,00 no Pix",
    shortName: "R$ 5.000",
  },
];

interface HeaderComponentsProps {
  id?: string;
  img?: string;
  name?: string;
  
}
export  function  HeaderComponents({img,id,name}: HeaderComponentsProps) {
  const [selectedPrize, setSelectedPrize] = useState(1);
  function primieroletradonome(name: string){
    return name.trim().charAt(0).toUpperCase();
  }
  return (
    <header className="w-full bg-[#090c0a]">

      {/* HEADER PRINCIPAL */}
      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl",
          "items-center justify-between",
          "px-4 py-3",
          "sm:px-6 sm:py-4",
          "lg:px-8"
        )}
      >
        {/* LOGO */}
        <Link
          href="/"
          aria-label="Acertou Ganhou - Início"
          className="flex shrink-0 items-center"
        >
          <Image
            src={Logo}
            alt="Acertou Ganhou"
            priority
            className={cn(
              "h-auto w-[100px] object-contain",
              "transition-opacity duration-200",
              "hover:opacity-90",
              "sm:w-[145px]",
              "lg:w-[160px]"
            )}
          />
        </Link>

        {/* BOTÃO ENTRAR */}
       <div className="flex items-center  gap-1">
      {!id ? (
        <>
          <DrawerLogin />
          <DraweCadastro />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
             <div className="p-2 bg-accet border text-accent-foreground rounded-full overflow-hidden">
                R$ 0,00
             </div>

             <div className="size-10 flex items-center justify-center border rounded-full ">
              <Bell className="size-5" />
             </div>
            
             <DropdownMenuDemo name={name as ""} />
             
          </div>
        </>
      )}
       </div>
      </div>

      {/* NAVEGAÇÃO DE PRÊMIOS */}
      <div className="mx-auto border-b w-full max-w-7xl">

   
        {/* LISTA HORIZONTAL */}
        <nav
          aria-label="Prêmios disponíveis"
          className={cn(
            "flex w-full items-start",
            "gap-4 overflow-x-auto",
            "overscroll-x-contain scroll-smooth",
            "px-4 pb-5 pt-3",
            "sm:gap-6 sm:px-6",
            "lg:justify-center lg:gap-8 lg:px-8",
            "[scrollbar-width:none]",
            "[&::-webkit-scrollbar]:hidden"
          )}
        >
          {navItems.map((item) => {
            const isSelected = selectedPrize === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedPrize(item.id)}
                aria-label={`Selecionar ${item.name}`}
                aria-pressed={isSelected}
                className={cn(
                  "group flex shrink-0 flex-col items-center",
                  "gap-2 outline-none",
                  "focus-visible:rounded-lg",
                  "focus-visible:ring-2",
                  "focus-visible:ring-lime-400"
                )}
              >
                {/* IMAGEM CIRCULAR */}
                <div
                  className={cn(
                    "relative flex items-center justify-center",
                    "size-[72px] rounded-full",
                    "p-[2px]",
                    "transition-all duration-200",
                    "sm:size-[84px]",
                    "lg:size-[92px]",

                    isSelected
                      ? "bg-[#c8f31d]"
                      : "bg-white/10 group-hover:bg-white/20"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-full items-center justify-center",
                      "overflow-hidden rounded-full",
                      "bg-[#101510]"
                    )}
                  >
                    <Image
                      src={item.img}
                      alt={item.name}
                      quality={90}
                      sizes="(max-width: 640px) 72px, (max-width: 1024px) 84px, 92px"
                      className={cn(
                        "size-full object-contain",
                        "transition-transform duration-200",
                        "group-hover:scale-[1.04]"
                      )}
                    />
                  </div>
                </div>

                {/* NOME DO PRÊMIO */}
                <span
                  className={cn(
                    "max-w-[85px] truncate text-center",
                    "text-[11px] font-medium",
                    "transition-colors duration-200",
                    "sm:max-w-[100px] sm:text-xs",

                    isSelected
                      ? "text-[#c8f31d]"
                      : "text-zinc-400 group-hover:text-zinc-200"
                  )}
                >
                  {item.shortName}
                </span>

                {/* INDICADOR SELECIONADO */}
                <span
                  className={cn(
                    "h-[2px] w-4 rounded-full",
                    "transition-all duration-200",

                    isSelected
                      ? "bg-[#c8f31d]"
                      : "bg-transparent"
                  )}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}