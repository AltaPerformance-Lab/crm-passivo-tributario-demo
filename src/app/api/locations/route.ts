// src/app/api/locations/route.ts

import { NextResponse } from "next/server";
import prisma from "@//lib/prisma";

export async function GET() {
  try {
    const locationsData = await prisma.empresa.findMany({
      where: {
        uf: { not: null },
        municipio: { not: null },
      },
      select: {
        uf: true,
        municipio: true,
      },
      distinct: ["uf", "municipio"],
    });

    // Agrupamos as cidades por estado
    const groupedByUf = locationsData.reduce((acc, { uf, municipio }) => {
      if (!uf || !municipio) return acc;

      if (!acc[uf]) {
        acc[uf] = new Set<string>();
      }
      acc[uf].add(municipio);

      return acc;
    }, {} as Record<string, Set<string>>);

    // Formatamos para o frontend
    const result = Object.entries(groupedByUf)
      .map(([uf, citiesSet]) => ({
        uf,
        cities: Array.from(citiesSet).sort(),
      }))
      .sort((a, b) => a.uf.localeCompare(b.uf));

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erro ao buscar localizações." },
      { status: 500 }
    );
  }
}
