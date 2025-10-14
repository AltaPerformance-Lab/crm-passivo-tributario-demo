// Local: GARANTA que este arquivo esteja na raiz do projeto ou em 'src/auth.ts'

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password" },
      },
      async authorize(credentials) {
        if (!process.env.AUTH_USER || !process.env.AUTH_PASS) {
          console.error(
            "ERRO: As variáveis AUTH_USER ou AUTH_PASS não foram definidas."
          );
          return null;
        }

        if (
          credentials.username === process.env.AUTH_USER &&
          credentials.password === process.env.AUTH_PASS
        ) {
          return { id: "1", name: "Administrador" };
        }

        console.log("Credenciais inválidas.");
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
});
