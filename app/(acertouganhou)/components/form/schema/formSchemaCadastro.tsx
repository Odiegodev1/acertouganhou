import z from "zod"

export const formSchemaCadastro = z.object({
  name: z.string().min(1, "O nome e obrigátorio").max(52, "erro max."),
    Gmail: z
      .string()
      .min(5, "gmail obrigatorio")
      .max(52, "erro max."),
      Cpf:z.string().min(1, "O CPF  e obrigátorio").max(11, "CPF inválido"),
      Telefone: z.string().optional(),
    Senha: z.string().min(8, "O minimo da senha e 8 caracteres")
   
  })

export type FormSchemaCadastro = z.infer<typeof formSchemaCadastro>;