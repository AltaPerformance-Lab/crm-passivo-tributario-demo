// src/app/api/auth/register/route.ts (Versão com Trava de Admin)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "../../../../../auth";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Todos os campos são obrigatórios." },
        { status: 400 }
      );
    }

    // Primeiro, contamos quantos usuários já existem no banco.
    const userCount = await prisma.user.count();

    // LÓGICA DE ADMIN CORRIGIDA:
    // Se já existe 1 ou mais usuários, a rota só pode ser acessada por um admin.
    if (userCount > 0) {
      const session = await auth();
      // Verificamos a role do usuário que está tentando fazer o registro.
      if (session?.user?.role !== "ADMIN") {
        return NextResponse.json(
          {
            message:
              "Acesso negado. Apenas administradores podem registrar novos usuários.",
          },
          { status: 403 } // 403 Forbidden
        );
      }
    }

    // Se a lógica acima passou (ou se não há usuários), continuamos...
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "Este e-mail já está em uso." },
        { status: 409 } // 409 Conflict
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Esta lógica continua perfeita: se for o primeiro usuário, ele se torna ADMIN.
    const userRole = userCount === 0 ? "ADMIN" : "USER";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
