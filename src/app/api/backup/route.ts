import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { PassThrough } from "stream";

export async function GET() {
  try {
    // --- CORREÇÃO APLICADA AQUI ---
    const containerName = "prospect-crm-db";
    const dbUser = "myuser";
    const dbName = "prospectdb";

    const command = "pg_dump";
    const args = ["-U", dbUser, "-d", dbName];

    const child = spawn("docker", ["exec", containerName, command, ...args]);

    const stream = new PassThrough();

    child.stdout.pipe(stream);
    child.stderr.on("data", (data) => {
      console.error(`Erro no pg_dump: ${data}`);
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
