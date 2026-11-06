"use server"

import { signIn } from "@/lib/auth"
import { FormSchemaEntrar } from "../schema/formentraschema"
import { revalidatePath } from "next/cache"
import { AuthError } from "next-auth"

export async function CreateUser(data: FormSchemaEntrar) {
  try {
    await signIn("credentials", {
      email: data.Gmail,
      password: data.Senha,
      redirect: false,
    })

    revalidatePath("/")

    return {
      success: true,
      message: "Login realizado com sucesso!",
    }

  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: "E-mail ou senha incorretos.",
          }

        default:
          return {
            success: false,
            error: "Erro na autenticação.",
          }
      }
    }

    console.error("Erro interno:", error)

    return {
      success: false,
      error: "Erro interno no servidor.",
    }
  }
}