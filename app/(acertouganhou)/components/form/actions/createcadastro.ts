"use server";

import { AuthError } from "next-auth";
import { Prisma } from "@/lib/generated/prisma/client";
import { signIn } from "@/lib/auth";
import { saltAndHashPassword } from "@/lib/crypto";
import prisma from "@/lib/prisma";

import {
  formSchemaCadastro,
  type FormSchemaCadastro,
} from "../schema/formSchemaCadastro";

type CadastroResult =
  | {
      success: true;
      loginSuccess: boolean;
      message: string;
      error?: never;
    }
  | {
      success: false;
      loginSuccess: false;
      error: string;
      message?: never;
    };

export async function CreateCadastro(
  data: FormSchemaCadastro
): Promise<CadastroResult> {
  // 1. Validar os dados
  const validated = formSchemaCadastro.safeParse(data);

  if (!validated.success) {
    return {
      success: false,
      loginSuccess: false,
      error: "Verifique os dados informados.",
    };
  }

  const values = validated.data;

  // 2. Normalizar dados
  const email = values.Gmail.trim().toLowerCase();
  const cpf = values.Cpf.replace(/\D/g, "");
  const phone = values.Telefone?.replace(/\D/g, "") || null;

  try {
    // 3. Verificar e-mail
    const emailExists = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailExists) {
      return {
        success: false,
        loginSuccess: false,
        error: "Este e-mail já está cadastrado.",
      };
    }

    // 4. Verificar CPF
    const cpfExists = await prisma.user.findUnique({
      where: { cpf },
      select: { id: true },
    });

    if (cpfExists) {
      return {
        success: false,
        loginSuccess: false,
        error: "Este CPF já está cadastrado.",
      };
    }

    // 5. Verificar telefone
    if (phone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone },
        select: { id: true },
      });

      if (phoneExists) {
        return {
          success: false,
          loginSuccess: false,
          error: "Este telefone já está cadastrado.",
        };
      }
    }

    // 6. Criptografar senha
    const hashedPassword = await saltAndHashPassword(values.Senha);

    // 7. Criar usuário
    await prisma.user.create({
      data: {
        name: values.name,
        email,
        password: hashedPassword,
        cpf,
        phone,
      },
    });
  } catch (error) {
    // 8. Tratar dados duplicados
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;

      const fields = Array.isArray(target)
        ? target.map(String)
        : [String(target ?? "")];

      if (fields.some((field) => field.includes("phone"))) {
        return {
          success: false,
          loginSuccess: false,
          error: "Este telefone já está cadastrado.",
        };
      }

      if (fields.some((field) => field.includes("cpf"))) {
        return {
          success: false,
          loginSuccess: false,
          error: "Este CPF já está cadastrado.",
        };
      }

      if (fields.some((field) => field.includes("email"))) {
        return {
          success: false,
          loginSuccess: false,
          error: "Este e-mail já está cadastrado.",
        };
      }

      return {
        success: false,
        loginSuccess: false,
        error: "Já existe um cadastro com esses dados.",
      };
    }

    console.error("[CADASTRO] Erro ao criar usuário:", error);

    return {
      success: false,
      loginSuccess: false,
      error: "Não foi possível concluir o cadastro. Tente novamente.",
    };
  }

  // 9. Login automático sem redirecionamento
  try {
    await signIn("credentials", {
      email,
      password: values.Senha,
      redirect: false,
    });

    return {
      success: true,
      loginSuccess: true,
      message: "Cadastro realizado com sucesso!",
    };
  } catch (error) {
    if (error instanceof AuthError) {
      console.error(
        "[CADASTRO] Falha no login automático:",
        error.type
      );

      return {
        success: true,
        loginSuccess: false,
        message:
          "Sua conta foi criada! Faça login para continuar.",
      };
    }

    throw error;
  }
}