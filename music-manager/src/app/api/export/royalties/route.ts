import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * CSV de splits y pagos: los datos de dinero no pueden vivir solo dentro de
 * la app — acaban en una declaración o en manos de un gestor.
 *
 * Separador ; y BOM UTF-8: es lo que hace que Excel en español lo abra en
 * columnas y con las tildes bien, sin pasar por "importar datos".
 */

function csvCell(v: string | number | null | undefined) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("No autorizado", { status: 401 });

  const songs = await prisma.song.findMany({
    where: { userId, royalties: { some: {} } },
    include: { royalties: { include: { payments: true }, orderBy: { createdAt: "asc" } } },
    orderBy: { title: "asc" },
  });

  const rows: string[] = [
    ["Canción", "Persona", "Rol", "Porcentaje", "Fecha de pago", "Importe pagado", "Moneda", "Concepto"].join(";"),
  ];

  const dateFmt = new Intl.DateTimeFormat("es-ES", { dateStyle: "short" });
  for (const song of songs) {
    for (const r of song.royalties) {
      if (r.payments.length === 0) {
        rows.push([csvCell(song.title), csvCell(r.name), csvCell(r.role), r.percentage, "", "", "", ""].join(";"));
      }
      for (const pay of r.payments) {
        rows.push(
          [
            csvCell(song.title),
            csvCell(r.name),
            csvCell(r.role),
            r.percentage,
            dateFmt.format(pay.date),
            // Coma decimal: coherente con el separador ; y con Excel es-ES.
            String(pay.amount).replace(".", ","),
            csvCell(pay.currency),
            csvCell(pay.notes),
          ].join(";")
        );
      }
    }
  }

  const body = "﻿" + rows.join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="royalties.csv"',
    },
  });
}
