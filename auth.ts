import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { User, Role } from "@prisma/client"; // Importamos os tipos do Prisma

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.password) {
          return null;
        }
        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (passwordsMatch) {
          return user;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      // Quando o usuário faz login, o objeto 'user' está presente
      if (user) {
        token.id = user.id;
        token.role = (user as User).role;
      }
      return token;
    },
    session({ session, token }) {
      // A cada requisição, o 'token' é usado para montar a 'session'
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as Role;
      }
      return session;
    },
  },
});
