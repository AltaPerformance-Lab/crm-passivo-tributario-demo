// src/lib/prisma.ts

import { PrismaClient } from "@prisma/client";

// Declaramos uma variável global para armazenar a instância do Prisma
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"], // Opcional: mostra as queries no console do servidor
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
