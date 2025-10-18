import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  // A propriedade 'providers' é obrigatória pelo tipo NextAuthConfig.
  // Deixamos vazia, pois a lógica de Credentials será usada diretamente no auth.ts.
  providers: [],

  pages: {
    signIn: "/login",
  },
  // Você pode adicionar callbacks ou outras configurações aqui se quiser.
} satisfies NextAuthConfig;
