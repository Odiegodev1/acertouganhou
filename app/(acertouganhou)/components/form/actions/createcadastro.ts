'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth'; // Substitua pelo caminho correto do seu arquivo auth.ts
import { saltAndHashPassword } from '@/lib/crypto';
import prisma from '@/lib/prisma';
import { FormSchemaCadastro } from '../schema/formSchemaCadastro';


export async function CreateCadastro(data: FormSchemaCadastro) {
  try {
    // 1. Verificar se o usuário já existe
    const userExists = await prisma.user.findUnique({
      where: { email: data.Gmail }
    });

    if (userExists) {
      return { error: 'Este e-mail já está cadastrado.' };
    }

    // 2. Criptografar a senha do usuário
    const hashedPassword = await saltAndHashPassword(data.Senha);

    // 3. Salvar o novo usuário no banco de dados
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.Gmail,
        password: hashedPassword,
        cpf: data.Cpf,
        phone: data.Telefone || null, // Se o telefone for opcional

        

       
      }
    });

    // 4. Realizar o login automático após o cadastro bem-sucedido
    await signIn('credentials', {
      email: data.Gmail,
      password: data.Senha,
      redirectTo: '/dashboard', // Altere para a sua rota interna protegida
    });

    return { success: true };

  } catch (error) {
    // O NextAuth utiliza redirecionamentos internos que jogam erros controlados.
    // É crucial repassar esses erros para o Next.js gerenciar o redirect.
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Credenciais inválidas ou falha na autenticação automática.' };
        default:
          return { error: 'Ocorreu um erro inesperado no sistema.' };
      }
    }
    
    // Repassa o erro de redirecionamento nativo do Next.js se necessário
    throw error;
  }
}
