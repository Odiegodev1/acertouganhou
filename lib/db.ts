// Exemplo utilizando Prisma ORM

import prisma from "./prisma";

export async function getUserFromDb(email: string) {
  return await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
}
