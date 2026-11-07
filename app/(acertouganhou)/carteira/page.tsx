import { auth } from "@/lib/auth";
import { HeaderComponents } from "../components/HeaderComponents";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Wallet,
  Trophy,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock3,
  ChevronRight,
  ShieldCheck,
  Info,
  History,
  CircleCheck,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

export const instant = false;

const resumo = [
  {
    label: "Total depositado",
    value: "R$ 0,00",
    icon: ArrowDownLeft,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    label: "Total sacado",
    value: "R$ 0,00",
    icon: ArrowUpRight,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    label: "Prêmios recebidos",
    value: "R$ 0,00",
    icon: Trophy,
    color: "text-[#c8f31d]",
    bg: "bg-[#c8f31d]/10",
  },
];

export default async function Carteira() {
  const session = await auth();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-2 bg-[#0c110d] text-white">
      <HeaderComponents
        banner={true}
        id={session?.user?.id ?? ""}
        img={session?.user?.image ?? ""}
        name={session?.user?.name ?? ""}
      />

      <main className="space-y-7 px-4 pt-5 pb-28 md:px-6 md:pb-10">

        {/* TÍTULO */}
        <section>
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-[#c8f31d]" />

            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              Minha carteira
            </h1>
          </div>

          <p className="mt-1 text-sm text-zinc-500">
            Gerencie seu saldo e acompanhe suas movimentações.
          </p>
        </section>

        {/* CARD PRINCIPAL */}
        <Card className="relative gap-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111812] py-0 text-white shadow-xl">

          {/* Efeito de iluminação */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-[#c8f31d]/[0.08] blur-3xl"
          />

          <CardHeader className="relative flex flex-row items-center justify-between px-5 pt-5 pb-0">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl border border-[#c8f31d]/15 bg-[#c8f31d]/10">
                <Wallet className="size-5 text-[#c8f31d]" />
              </div>

              <div>
                <p className="text-sm font-semibold text-zinc-200">
                  Saldo disponível
                </p>

                <p className="text-xs text-zinc-500">
                  Seu dinheiro para jogar
                </p>
              </div>
            </div>

           
          </CardHeader>

          <CardContent className="relative px-5 pt-8 pb-7">
            <p className="mb-2 text-xs text-zinc-500">
              Saldo total em conta
            </p>

            <div className="flex items-end gap-2">
              <span className="mb-1 text-lg font-medium text-zinc-400">
                R$
              </span>

              <h2 className="text-[44px] leading-none font-bold tracking-[-0.05em] text-white md:text-5xl">
                0,00
              </h2>
            </div>

          
          </CardContent>

          <div className="mx-5 h-px bg-white/[0.07]" />

          <CardFooter className="relative grid grid-cols-2 gap-3 px-5 py-5">

            <Button className="h-12 gap-2 rounded-xl bg-[#c8f31d] text-[13px] font-bold text-[#111412] shadow-[0_4px_18px_rgba(200,243,29,0.15)] transition-all hover:bg-[#d8ff4d] active:scale-[0.97]">
              <Plus className="size-[18px]" strokeWidth={2.5} />
              Depositar
            </Button>

            <Button
              variant="outline"
              className="h-12 gap-2 rounded-xl border-white/[0.12] bg-white/[0.04] text-[13px] font-semibold text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-[0.97]"
            >
              <ArrowUpRight className="size-[18px]" strokeWidth={2} />
              Sacar
            </Button>

          </CardFooter>
        </Card>

        {/* RESUMO FINANCEIRO */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Resumo financeiro
            </h2>

            <span className="text-xs text-zinc-500">
              Visão geral
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {resumo.map((item, index) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.label}
                  className={`gap-0 rounded-2xl border border-white/[0.07] bg-[#111812] p-4 text-white ${
                    index === 2 ? "col-span-2 md:col-span-1" : ""
                  }`}
                >
                  <CardContent className="space-y-4 p-0">
                    <div
                      className={`flex size-9 items-center justify-center rounded-xl ${item.bg}`}
                    >
                      <Icon className={`size-[18px] ${item.color}`} />
                    </div>

                    <div>
                      <p className="text-[11px] text-zinc-500">
                        {item.label}
                      </p>

                      <h3 className="mt-1 text-lg font-bold tracking-tight">
                        {item.value}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* HISTÓRICO */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">
                Últimas movimentações
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Acompanhe suas transações
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-[#c8f31d] hover:bg-[#c8f31d]/10 hover:text-[#c8f31d]"
            >
              Ver todas
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Card className="gap-0 rounded-2xl border border-white/[0.07] bg-[#111812] py-0 text-white">
            <CardContent className="flex flex-col items-center justify-center px-5 py-12 text-center">
              <div className="relative mb-5">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                  <History className="size-7 text-zinc-500" />
                </div>

                <div className="absolute -right-2 -bottom-2 flex size-7 items-center justify-center rounded-full border-4 border-[#111812] bg-[#c8f31d]">
                  <Clock3 className="size-3.5 text-[#111412]" />
                </div>
              </div>

              <h3 className="text-sm font-semibold text-zinc-200">
                Nenhuma movimentação ainda
              </h3>

              <p className="mt-2 max-w-[260px] text-xs leading-relaxed text-zinc-500">
                Seus depósitos, saques e prêmios recebidos aparecerão aqui.
              </p>

              <Button
                variant="outline"
                className="mt-6 h-10 rounded-xl border-white/[0.1] bg-white/[0.04] px-5 text-xs text-zinc-200 hover:bg-white/[0.08] hover:text-white"
              >
                <Plus className="mr-2 size-4" />
                Fazer primeiro depósito
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* INFORMAÇÕES */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">
            Informações da carteira
          </h2>

          <Card className="gap-0 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111812] py-0 text-white">
            <CardContent className="divide-y divide-white/[0.06] p-0">

              {/* DEPÓSITOS */}
              <div className="flex items-center gap-3 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-400/10">
                  <ArrowDownToLine className="size-5 text-blue-400" />
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-medium">
                    Depósitos
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Adicione saldo à sua carteira.
                  </p>
                </div>

                <ChevronRight className="size-4 text-zinc-600" />
              </div>

              {/* SAQUES */}
              <div className="flex items-center gap-3 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-400/10">
                  <ArrowUpFromLine className="size-5 text-orange-400" />
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-medium">
                    Saques
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Consulte as condições para retirar seu saldo.
                  </p>
                </div>

                <ChevronRight className="size-4 text-zinc-600" />
              </div>

              {/* SEGURANÇA */}
              <div className="flex items-center gap-3 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#c8f31d]/10">
                  <LockKeyhole className="size-5 text-[#c8f31d]" />
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-medium">
                    Segurança da conta
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Proteja o acesso à sua carteira.
                  </p>
                </div>

                <ChevronRight className="size-4 text-zinc-600" />
              </div>

            </CardContent>
          </Card>
        </section>

        {/* AVISO */}
        <div className="flex items-start gap-3 rounded-xl border border-[#c8f31d]/10 bg-[#c8f31d]/[0.04] p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-[#c8f31d]" />

          <p className="text-xs leading-relaxed text-zinc-400">
            Todas as movimentações da sua carteira poderão ser
            consultadas no histórico. Confira sempre os valores
            e os dados antes de confirmar qualquer operação.
          </p>
        </div>

      </main>
    </div>
  );
}