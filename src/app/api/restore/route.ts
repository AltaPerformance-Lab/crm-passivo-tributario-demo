// Caminho inferido: /src/app/api/backup/restore/route.ts (Versão Segura)

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import os from "os";
import { auth } from "../../../../auth"; // Importamos a autenticação

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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
      { status: 403 } // 403 Forbidden é o status correto para acesso negado
    );
  }
  // ==========================================================

  let tempFilePath = "";
  try {
    const formData = await req.formData();
    const file = formData.get("backupFile") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "Nenhum ficheiro de backup enviado." },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const tempDir = path.join(os.tmpdir(), "crm-restores");
    await mkdir(tempDir, { recursive: true });
    tempFilePath = path.join(tempDir, file.name);
    await writeFile(tempFilePath, fileBuffer);

    const containerName = "prospect-crm-db";
    const dbUser = "myuser";
    const dbName = "prospectdb";

    // Copia o ficheiro para o container
    await new Promise<void>((resolve, reject) => {
      const copyProc = spawn("docker", [
        "cp",
        tempFilePath,
        `${containerName}:/tmp/backup.sql`,
      ]);
      copyProc.on("close", (code) =>
        code === 0
          ? resolve()
          : reject(
              new Error(
                `Falha ao copiar o backup para o container. Código: ${code}`
              )
            )
      );
      copyProc.stderr.on("data", (data) =>
        console.error(`docker cp stderr: ${data}`)
      );
    });

    const commandsToRun = [
      `psql -U ${dbUser} -d postgres -c 'DROP DATABASE IF EXISTS ${dbName} WITH (FORCE);'`,
      `psql -U ${dbUser} -d postgres -c 'CREATE DATABASE ${dbName};'`,
      `psql -U ${dbUser} -d ${dbName} -f /tmp/backup.sql`,
    ].join(" && ");

    // Executa os comandos de restauração dentro do container
    await new Promise<void>((resolve, reject) => {
      const restoreProc = spawn("docker", [
        "exec",
        containerName,
        "sh",
        "-c",
        commandsToRun,
      ]);
      restoreProc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `Falha ao executar a restauração dentro do container. Código: ${code}`
            )
          );
        }
      });
      restoreProc.stderr.on("data", (data) =>
        console.error(`docker exec stderr: ${data}`)
      );
      restoreProc.stdout.on("data", (data) =>
        console.log(`docker exec stdout: ${data}`)
      );
    });

    return NextResponse.json({
      message: "Banco de dados restaurado com sucesso!",
    });
  } catch (error) {
    console.error("Falha ao restaurar o backup:", error);
    return NextResponse.json(
      {
        message: "Erro interno ao restaurar o backup.",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  } finally {
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (cleanupError) {
        console.error(
          "Erro ao limpar ficheiro de backup temporário:",
          cleanupError
        );
      }
    }
  }
}
