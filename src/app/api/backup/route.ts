// Caminho inferido: src/app/api/backup/generate/route.ts (Versão Segura)

import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { PassThrough } from "stream";
import { auth } from "../../../../auth"; // Importamos a autenticação

export const runtime = "nodejs";

export async function GET() {
  try {
    // ==========================================================
    //          FIREWALL DE SEGURANÇA (ETAPA CRÍTICA)
    // ==========================================================
    const session = await auth();
    // Verificamos não apenas se o usuário está logado, mas se ele é um ADMIN
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        {
          message:
            "Acesso negado. Apenas administradores podem executar esta ação.",
        },
        { status: 403 } // 403 Forbidden
      );
    }
    // ==========================================================

    // Boa prática: Mover dados sensíveis para variáveis de ambiente
    const containerName = process.env.DB_CONTAINER_NAME || "prospect-crm-db";
    const dbUser = process.env.DB_USER || "myuser";
    const dbName = process.env.DB_NAME || "prospectdb";

    const command = "pg_dump";
    const args = ["-U", dbUser, "-d", dbName, "--clean", "--if-exists"]; // Adicionado flags para um restore mais limpo

    const child = spawn("docker", ["exec", containerName, command, ...args]);
    const stream = new PassThrough();

    child.stdout.pipe(stream);
    child.stderr.on("data", (data) => {
      console.error(`Erro no pg_dump: ${data}`);
      // Se houver um erro no pg_dump, precisamos parar o stream
      stream.emit("error", new Error(data.toString()));
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-crm-${timestamp}.sql`;

    return new Response(stream as any, {
      headers: {
        "Content-Disposition": `attachment; filename=${filename}`,
        "Content-Type": "application/sql",
      },
    });
  } catch (error) {
    console.error("Falha ao gerar o backup:", error);
    return NextResponse.json(
      { message: "Erro interno ao gerar o backup." },
      { status: 500 }
    );
  }
}
