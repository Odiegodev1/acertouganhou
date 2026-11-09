import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

import { HeaderComponents } from "../components/HeaderComponents"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"

import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  History,
  Info,
  LockKeyhole,
  Trophy,
  Wallet,
} from "lucide-react"

import { CarteiraActions } from "./compoents/carteiraactions"
import { CarteiraSaldo } from "./compoents/carteira-saldo"

// ==========================================
// NEXT.JS 16 - ROTA DINÂMICA
// ==========================================

export const instant = false

// ==========================================
// FORMATADORES
// ==========================================

function formatCurrency(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function formatCredits(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(value: Date) {
  return value.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  })
}

// ==========================================
// PÁGINA CARTEIRA
// ==========================================

export default async function Carteira() {
  const session = await auth()

  const userId = session?.user?.id

  // ==========================================
  // CONSULTAR DADOS
  // ==========================================

  const [account, deposits, withdrawals, gameWallet] = userId
    ? await Promise.all([
        prisma.paymentAccount.findUnique({
          where: { userId },
          select: {
            availableBalance: true,
            reservedBalance: true,
          },
        }),

        prisma.paymentDeposit.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        }),

        prisma.paymentWithdrawal.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        }),

        prisma.wallet.findUnique({
          where: { userId },
          select: {
            balance: true,
          },
        }),
      ])
    : ([null, [], [], null] as const)

  // ==========================================
  // SALDOS
  // ==========================================

  const financialBalance = account?.availableBalance ?? 0

  const reservedBalance = account?.reservedBalance ?? 0

  const gameBalance = gameWallet?.balance ?? 0

  // ==========================================
  // RESUMO FINANCEIRO
  // ==========================================

  const totalDeposited = deposits
    .filter((item) => item.status === "PAID")
    .reduce((total, item) => total + item.amount, 0)

  const totalWithdrawn = withdrawals
    .filter((item) => item.status === "PAID")
    .reduce((total, item) => total + item.amount, 0)

  // ==========================================
  // HISTÓRICO
  // ==========================================

  const history = [
    ...deposits.map((item) => ({
      id: `deposit-${item.id}`,
      title: "Depósito Pix",
      type: "deposit" as const,
      amount: item.amount,
      status: item.status,
      createdAt: item.createdAt,
    })),

    ...withdrawals.map((item) => ({
      id: `withdrawal-${item.id}`,
      title: "Saque Pix",
      type: "withdrawal" as const,
      amount: item.amount,
      status: item.status,
      createdAt: item.createdAt,
    })),
  ]
    .sort(
      (a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime()
    )
    .slice(0, 10)

  const summary = [
    {
      label: "Total depositado",
      value: totalDeposited,
      icon: ArrowDownLeft,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Total sacado",
      value: totalWithdrawn,
      icon: ArrowUpRight,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
  ]

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col text-white">
      <HeaderComponents
        banner
        id={userId ?? ""}
        img={session?.user?.image ?? ""}
        name={session?.user?.name ?? ""}
      />

      <main className="space-y-7 px-4 pb-28 pt-5 md:px-6 md:pb-10">
        {/* ======================================
            TÍTULO
        ====================================== */}

        <section>
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-[#C8F31D]" />

            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              Minha carteira
            </h1>
          </div>

          <p className="mt-1 text-sm text-zinc-500">
            Acompanhe seus créditos e suas movimentações.
          </p>
        </section>

        {/* ======================================
            SALDO PRINCIPAL - JOGO
        ====================================== */}

        <Card className="relative gap-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111812] py-0 text-white shadow-xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-[#C8F31D]/[0.08] blur-3xl"
          />

          <CardHeader className="relative flex flex-row items-center gap-3 px-5 pb-0 pt-5">
            <div className="flex size-11 items-center justify-center rounded-xl border border-[#C8F31D]/15 bg-[#C8F31D]/10">
              <Wallet className="size-5 text-[#C8F31D]" />
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-200">
                Saldo de créditos
              </p>

              <p className="text-xs text-zinc-500">
                Créditos disponíveis para jogar
              </p>
            </div>
          </CardHeader>

          <CardContent className="relative px-5 pb-7 pt-8">
            <p className="mb-2 text-xs text-zinc-500">
              Saldo disponível
            </p>

            <CarteiraSaldo
              initialBalance={gameBalance}
            />

            <div className="mt-5 flex items-center gap-2 text-xs text-zinc-400">
              <LockKeyhole className="size-3.5" />

              <span>
                Créditos demonstrativos não disponíveis para saque
              </span>
            </div>
          </CardContent>

          <div className="mx-5 h-px bg-white/[0.07]" />

          <CardFooter className="relative px-5 py-5">
            <CarteiraActions />
          </CardFooter>
        </Card>

        {/* ======================================
            SALDO FINANCEIRO
        ====================================== */}

        <Card className="gap-0 rounded-2xl border border-white/[0.07] bg-[#111812] p-5 text-white">
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-blue-400/10">
                  <Wallet className="size-5 text-blue-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Saldo financeiro
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Conta de pagamentos
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-white">
                  {formatCurrency(financialBalance)}
                </p>

                <p className="mt-1 text-[11px] text-zinc-500">
                  Reservado: {formatCurrency(reservedBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ======================================
            RESUMO FINANCEIRO
        ====================================== */}

        <section className="space-y-4">
          <h2 className="text-base font-semibold">
            Resumo financeiro
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {summary.map((item) => {
              const Icon = item.icon

              return (
                <Card
                  key={item.label}
                  className="gap-0 rounded-2xl border border-white/[0.07] bg-[#111812] p-4 text-white"
                >
                  <CardContent className="space-y-4 p-0">
                    <div
                      className={`flex size-9 items-center justify-center rounded-xl ${item.bg}`}
                    >
                      <Icon
                        className={`size-[18px] ${item.color}`}
                      />
                    </div>

                    <div>
                      <p className="text-[11px] text-zinc-500">
                        {item.label}
                      </p>

                      <h3 className="mt-1 text-lg font-bold tracking-tight">
                        {formatCurrency(item.value)}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* CRÉDITOS DEMONSTRATIVOS */}

          <Card className="gap-0 rounded-2xl border border-[#C8F31D]/10 bg-[#111812] p-4 text-white">
            <CardContent className="flex items-center gap-3 p-0">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#C8F31D]/10">
                <Trophy className="size-5 text-[#C8F31D]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  Créditos demonstrativos
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Não representam dinheiro disponível para saque.
                </p>
              </div>

              <span className="text-lg font-bold text-[#C8F31D]">
                {formatCredits(gameBalance)}
              </span>
            </CardContent>
          </Card>
        </section>

        {/* ======================================
            HISTÓRICO
        ====================================== */}

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">
              Últimas movimentações
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Histórico de depósitos e saques
            </p>
          </div>

          <Card className="gap-0 rounded-2xl border border-white/[0.07] bg-[#111812] py-0 text-white">
            {history.length === 0 ? (
              <CardContent className="flex flex-col items-center justify-center px-5 py-12 text-center">
                <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                  <History className="size-7 text-zinc-500" />
                </div>

                <h3 className="text-sm font-semibold text-zinc-200">
                  Nenhuma movimentação ainda
                </h3>

                <p className="mt-2 max-w-[260px] text-xs leading-relaxed text-zinc-500">
                  Seus depósitos e saques aparecerão aqui.
                </p>
              </CardContent>
            ) : (
              <CardContent className="divide-y divide-white/[0.06] p-0">
                {history.map((item) => {
                  const isDeposit = item.type === "deposit"

                  const Icon = isDeposit
                    ? ArrowDownLeft
                    : ArrowUpRight

                  const isPaid = item.status === "PAID"

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-4"
                    >
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                          isDeposit
                            ? "bg-blue-400/10"
                            : "bg-orange-400/10"
                        }`}
                      >
                        <Icon
                          className={`size-5 ${
                            isDeposit
                              ? "text-blue-400"
                              : "text-orange-400"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {item.title}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                          <Clock3 className="size-3" />
                          {formatDate(item.createdAt)}
                        </p>

                        <p
                          className={`mt-1 text-[11px] ${
                            isPaid
                              ? "text-[#C8F31D]"
                              : "text-amber-400"
                          }`}
                        >
                          {item.status}
                        </p>
                      </div>

                      <span
                        className={`whitespace-nowrap text-sm font-bold ${
                          isDeposit
                            ? "text-blue-400"
                            : "text-white"
                        }`}
                      >
                        {isDeposit ? "+" : "-"}
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            )}
          </Card>
        </section>

        {/* ======================================
            INFORMAÇÕES
        ====================================== */}

        <div className="flex items-start gap-3 rounded-xl border border-[#C8F31D]/10 bg-[#C8F31D]/[0.04] p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-[#C8F31D]" />

          <p className="text-xs leading-relaxed text-zinc-400">
            Os créditos demonstrativos utilizados nos jogos
            são separados dos valores financeiros. Os créditos
            não representam dinheiro e não estão disponíveis
            para saque.
          </p>
        </div>
      </main>
    </div>
  )
}