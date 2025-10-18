// src/types/next-auth.d.ts

import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Role } from "@prisma/client"; // Importa o Enum Role do Prisma

declare module "next-auth" {
  /**
   * Estendemos o tipo da Sessão para incluir id e role.
   */
  interface Session {
    user: {
      id: string;
      role: Role; // Adiciona a role
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Estendemos o Token para que ele também contenha id e role. */
  interface JWT {
    id: string;
    role: Role;
  }
}
