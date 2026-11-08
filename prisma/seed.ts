import "dotenv/config"

import prisma  from "../lib/prisma"

const premios = [
  {
    id: "1",
    name: "R$ 200 no Pix",
    value: 20000,
    playCost: 200,
    targetMs: 5000,
    speedFactor: 1000,
    active: true,
    stock: 100,
  },
  {
    id: "2",
    name: "iPhone 17 Pro",
    value: 0,
    playCost: 3000,
    targetMs: 10000,
    speedFactor: 1000,
    active: true,
    stock: 10,
  },
  {
    id: "3",
    name: "PlayStation 5",
    value: 0,
    playCost: 1200,
    targetMs: 4000,
    speedFactor: 1000,
    active: true,
    stock: 10,
  },
  {
    id: "4",
    name: "R$ 1.000 no Pix",
    value: 100000,
    playCost: 500,
    targetMs: 3000,
    speedFactor: 1000,
    active: true,
    stock: 100,
  },
  {
    id: "5",
    name: "R$ 5.000 no Pix",
    value: 500000,
    playCost: 1000,
    targetMs: 15000,
    speedFactor: 1000,
    active: true,
    stock: 100,
  },
  {
    id: "6",
    name: 'Smart TV 55"',
    value: 0,
    playCost: 2000,
    targetMs: 2000,
    speedFactor: 1000,
    active: true,
    stock: 10,
  },
]

async function main() {
  console.log("Iniciando cadastro dos prêmios demo...")

  for (const premio of premios) {
    await prisma.prize.upsert({
      where: {
        id: premio.id,
      },
      update: {
        name: premio.name,
        value: premio.value,
        playCost: premio.playCost,
        targetMs: premio.targetMs,
        speedFactor: premio.speedFactor,
        active: premio.active,
        stock: premio.stock,
      },
      create: premio,
    })

    console.log(`Prêmio cadastrado: ${premio.name}`)
  }

  console.log("Todos os 6 prêmios foram cadastrados!")
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })