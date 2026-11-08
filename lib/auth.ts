import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { getUserFromDb } from "@/lib/db"

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: process.env.AUTH_SECRET,

  trustHost: true,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "Credenciais",

      credentials: {
        email: {
          label: "E-mail",
          type: "email",
        },
        password: {
          label: "Senha",
          type: "password",
        },
      },

      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password

        if (
          typeof email !== "string" ||
          typeof password !== "string"
        ) {
          return null
        }

        const normalizedEmail = email.trim().toLowerCase()

        if (!normalizedEmail || !password) {
          return null
        }

        const user = await getUserFromDb(normalizedEmail)

        if (!user?.password) {
          return null
        }

        const passwordValid = await bcrypt.compare(
          password,
          user.password
        )

        if (!passwordValid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id

        token.name = user.name
        token.email = user.email
      }

      return token
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }

      return session
    },
  },
})