import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserFromDb } from '@/lib/db'; // Sua função de banco

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: process.env.AUTH_SECRET, 
  
  trustHost: true,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 1. Busque o usuário APENAS pelo e-mail
        const user = await getUserFromDb(credentials.email as string);
        
        // Se o usuário não existir ou não tiver senha cadastrada (ex: login social)
        if (!user || !user.password) {
          return null;
        }

        // 2. Use o bcryptjs para comparar a senha digitada com o hash do banco
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password // O hash que veio do banco de dados
        );

        // 3. Se a senha for válida, retorne o objeto do usuário
        if (isValid) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        }

        // Se a senha estiver incorreta
        return null;
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      // Adicione o ID do usuário à sessão
      if (token?.sub && session.user) {
        session.user.id = token.sub; // O ID do usuário vem do token
      }
      return session;
    },
  },
});
