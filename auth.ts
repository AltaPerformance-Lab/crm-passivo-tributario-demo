//auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma"; // Importamos o Prisma Client
import bcrypt from "bcryptjs"; // Importamos o bcrypt

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // O nome das credenciais que o seu formulário de login vai enviar
      credentials: {
        email: { label: "Email" },
        password: { label: "Password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        // 1. Encontra o usuário no banco de dados pelo e-mail
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // Se não encontrar o usuário ou se a senha estiver ausente
        if (!user || !user.password) {
          return null;
        }

        // 2. Compara a senha enviada com a senha criptografada no banco
        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        // 3. Se as senhas baterem, retorna o objeto do usuário
        if (passwordsMatch) {
          // O objeto 'user' do Prisma contém 'id', 'name', 'email', 'role' etc.
          return user;
        }

        // Se as senhas não baterem, retorna nulo
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      // Após o login (quando 'user' existe), adiciona ID e ROLE ao token
      if (user) {
        token.id = user.id;
        // ADICIONA O ROLE AQUI: Agora a role está no token JWT
        (token as any).role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      // Adiciona o ID e a ROLE do token à sessão para que fique disponível em todo o app
      if (token && session.user) {
        (session.user as any).id = token.id;
        // ADICIONA O ROLE AQUI: Agora a role está no objeto de sessão
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
});
