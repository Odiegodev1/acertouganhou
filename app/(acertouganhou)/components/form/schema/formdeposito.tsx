import { z } from "zod"

export const formSchemaDeposito = z.object({
  valor: z
    .number()
    .int()
    .min(1000, "O valor mínimo é R$ 10,00.")
    .max(1000000, "O valor máximo é R$ 10.000,00."),

  withOffer: z.boolean(),
})

export type FormSchemaDeposito = z.infer<
  typeof formSchemaDeposito
>