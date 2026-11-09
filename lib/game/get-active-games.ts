import "server-only"

import prisma from "@/lib/prisma"

export async function getActiveGames() {
  return prisma.prize.findMany({
    where: {
      active: true,
    },
    select: {
      id: true,
      name: true,
      targetMs: true,
      playCost: true,
      stock: true,
    },
    orderBy: {
      id: "asc",
    },
  })
}