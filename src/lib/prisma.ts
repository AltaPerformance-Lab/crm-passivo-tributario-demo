import { PrismaClient } from "@prisma/client";

// Declaramos uma variável global para guardar a instância do Prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Criamos a instância do cliente, reutilizando a instância global se ela existir
// ou criando uma nova se não existir.
const client = globalThis.prisma || new PrismaClient();

// Em ambiente de desenvolvimento, guardamos a nova instância na variável global.
if (process.env.NODE_ENV !== "production") globalThis.prisma = client;

export default client;
