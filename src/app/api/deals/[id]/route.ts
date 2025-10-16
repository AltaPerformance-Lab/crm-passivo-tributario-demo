// src/app/api/deals/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const dealId = parseInt(params.id, 10);
    const { valorFechado, valorEscritorio, valorOutraParte, valorRecebido } =
      await request.json();

    const updatedDeal = await prisma.negocio.update({
      where: { id: dealId },
      data: { valorFechado, valorEscritorio, valorOutraParte, valorRecebido }, // <-- Adicionado
    });
    return NextResponse.json(updatedDeal);
  } catch (error) {
    /* ... */
  }
}
