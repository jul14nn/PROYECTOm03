"use server";

import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { isBlobConfigured } from "@/lib/blob";
import { revalidatePath } from "next/cache";

export async function removeAsset(id: string) {
  const userId = await requireUserId();

  // Se localiza antes de borrar para saber su ruta en el almacenamiento y de
  // paso comprobar que es de quien dice ser.
  const asset = await prisma.asset.findFirst({
    where: { id, userId },
    select: { id: true, pathname: true, songId: true },
  });
  if (!asset) return;

  if (isBlobConfigured()) {
    try {
      await del(asset.pathname);
    } catch {
      // Si el fichero ya no está en el almacenamiento, se sigue: lo que
      // importa es que deje de aparecer en la app.
    }
  }

  await prisma.asset.delete({ where: { id: asset.id } });

  if (asset.songId) revalidatePath(`/songs/${asset.songId}`);
  revalidatePath("/ajustes");
}

/**
 * Registro manual del activo.
 *
 * Normalmente lo crea `onUploadCompleted` en el servidor, pero ese aviso no
 * llega cuando se sube desde `localhost`: el almacenamiento no puede llamar a
 * una dirección que no existe fuera. Con esto el cliente puede registrarlo él
 * mismo, y el `upsert` por url evita duplicarlo en producción.
 */
export async function registerAsset(input: {
  url: string;
  pathname: string;
  kind: "AUDIO" | "VIDEO" | "FONT";
  songId: string | null;
  name: string;
  size: number;
  mimeType: string;
}) {
  const userId = await requireUserId();

  if (input.songId) {
    const song = await prisma.song.findFirst({
      where: { id: input.songId, userId },
      select: { id: true },
    });
    if (!song) throw new Error("Canción no encontrada");
  }

  const existing = await prisma.asset.findFirst({
    where: { userId, url: input.url },
    select: { id: true },
  });
  if (!existing) {
    await prisma.asset.create({ data: { userId, ...input } });
  }

  if (input.songId) revalidatePath(`/songs/${input.songId}`);
  revalidatePath("/ajustes");
}
