import z from "zod"

export const formSchemaEntrar = z.object({
    Gmail: z
      .string()
      .min(5, "gmail obrigatorio")
      .max(52, "erro max."),
    Senha: z.string().min(8, "O minimo da senha e 8 caracteres")
   
  })

export type FormSchemaEntrar = z.infer<typeof formSchemaEntrar>;