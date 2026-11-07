import Image, { StaticImageData } from "next/image";
import {
  ArrowUpRight,
  Gamepad2,
  Sparkles,
} from "lucide-react";

import Iphone from "@/public/layoutiphone.png";
import Tv from "@/public/layouttv.png";
import Play from "@/public/layoutplay.png";
import Dois from "@/public/layoutdois.png";
import Mil from "@/public/layoutmil.png";
import Cinco from "@/public/layoutcinco.png";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sl } from "zod/v4/locales";
import { DialogJogo } from "./DialogJogo";

type PremiosItems = {
  id: string;
  img: StaticImageData;
  tipo: string;
  nome: string;
  valor: number;
  destaque?: boolean;
  time?: number
};

const PremioItem: PremiosItems[] = [
  {
    id: "1",
    img: Dois,
    tipo: "Prêmio via Pix",
    nome: "R$ 200 no Pix",
    time: 5.0,
    valor: 2,
  },
  {
    id: "2",
    img: Iphone,
    tipo: "Tecnologia",
    nome: "iPhone 17 Pro",
    valor: 30,
    time:10.0,
    destaque: true,
  },
  {
    id: "3",
    img: Play,
    tipo: "Games",
    nome: "PlayStation 5",
    valor: 12,
    time:4.0
  },
  {
    id: "4",
    img: Mil,
    tipo: "Prêmio via Pix",
    nome: "R$ 1.000 no Pix",
    valor: 5,
    time:3.0
  },
  {
    id: "5",
    img: Cinco,
    tipo: "Prêmio via Pix",
    nome: "R$ 5.000 no Pix",
    valor: 10,
    destaque: true,
    time:15.0
  },
  {
    id: "6",
    img: Tv,
    tipo: "Tecnologia",
    nome: 'Smart TV 55"',
    valor: 20,
    time:2.0
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

interface LaoyutPremiosProps {
  slug? : string,
  nome? : string,
  desc? : string
}

export function LaoyutPremios({desc,nome,slug} : LaoyutPremiosProps) {

  function SeparaPrimeiroNome(nome: string): string {
    return nome.trim().split(" ")[0];
}

function SeparaSegundoNome(nome: string): string {
  return nome.trim().split(" ")[2];
}
console.log(SeparaPrimeiroNome("Premio premiun"))
console.log(SeparaSegundoNome("Premio premiun"))

  return (
    <section className="w-full  py-6 sm:py-10">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">

        {/* CABEÇALHO */}
        <div className="mb-5 flex items-end justify-between gap-3 sm:mb-7">

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#c8f31d]" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c8f31d] sm:text-xs">
                {slug || "Acertou Ganhou"}
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
            {SeparaPrimeiroNome(nome || "") || "Prêmios"} {" "}
              <span className="text-[#c8f31d]">
              {SeparaSegundoNome(nome || "") || "Premium"} 
              </span>
            </h2>

            <p className="text-xs text-zinc-500 sm:text-sm">
              Escolha seu desafio e tente acertar.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 sm:flex">
            <span className="size-1.5 rounded-full bg-[#c8f31d]" />

            <span className="text-xs font-medium text-zinc-400">
              {PremioItem.length} desafios
            </span>
          </div>
        </div>

        {/* GRID DE PRÊMIOS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:gap-6">

          {PremioItem.map((premio) => (
            <Card
              key={premio.id}
              className="
                group relative gap-0 overflow-hidden
                rounded-2xl border border-white/[0.08]
                bg-[#111612] p-0
                shadow-none
                transition-all duration-300
                hover:-translate-y-1
                hover:border-[#c8f31d]/30
                hover:bg-[#141b15]
              "
            >
              {/* IMAGEM DO PRÊMIO */}
              <div className="relative aspect-square w-full overflow-hidden bg-[#080c09]">

                <Image
                  src={premio.img}
                  alt={premio.nome}
                  fill
                  quality={90}
                  sizes="
                    (max-width: 640px) 50vw,
                    (max-width: 1024px) 33vw,
                    400px
                  "
                  className="
                    object-cover
                    transition-transform duration-500
                    group-hover:scale-[1.035]
                  "
                />

                {/* Gradiente inferior */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#111612] to-transparent" />

                {/* BADGE DESTAQUE */}
                {premio.destaque && (
                  <Badge
                    className="
                      absolute left-2 top-2
                      border-0 bg-lima
                      px-2 py-1
                      text-[9px] font-bold
                      text-[#101509]
                      shadow-sm
                      sm:left-3 sm:top-3
                      sm:text-[10px]
                    "
                  >
                    <Sparkles className="mr-1 size-3" />
                    DESTAQUE
                  </Badge>
                )}
              </div>

              {/* CONTEÚDO */}
              <div className="flex flex-1 flex-col p-3 pt-2 sm:p-4">

                {/* CATEGORIA */}
                <span className="mb-1 text-[10px] font-medium text-zinc-500 sm:text-xs">
                  {premio.tipo}
                </span>

                {/* NOME */}
                <h3 className="line-clamp-1 text-sm font-bold text-white sm:text-lg">
                  {premio.nome}
                </h3>

                {/* DIVISÓRIA */}
                <div className="my-3 h-px w-full bg-white/[0.06] sm:my-4" />

                {/* PREÇO */}
                <div className="mb-3 sm:mb-4">
                  <p className="mb-1 text-[10px] text-zinc-500 sm:text-xs">
                    Participação a partir de
                  </p>

                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-extrabold tracking-tight text-[#c8f31d] sm:text-2xl">
                      {formatCurrency(premio.valor)}
                    </span>
                  </div>
                </div>

                {/* BOTÃO JOGAR */}
               <DialogJogo id={premio.id} time={premio.time  ||  5.0} nome={premio.nome} tipo={premio.tipo} valor={premio.valor} img={premio.img }   />
              </div>
            </Card>
          ))}
        </div>

        {/* RODAPÉ */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center sm:mt-8">
          <Sparkles className="size-3.5 text-[#c8f31d]/60" />

          <p className="text-[11px] text-zinc-500 sm:text-xs">
            Escolha um prêmio e coloque sua precisão à prova.
          </p>
        </div>
      </div>
    </section>
  );
}