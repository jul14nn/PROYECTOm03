"use server";

import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { assertSongOwner } from "@/lib/actions/helpers";
import { isBlobConfigured } from "@/lib/blob";
import { revalidatePath } from "next/cache";

export async function addSongReference(songId: string, formData: FormData) {
  const userId = await requireUserId();
  await assertSongOwner(songId, userId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;
  if (!isBlobConfigured()) {
    throw new Error("Falta configurar Vercel Blob (BLOB_READ_WRITE_TOKEN) para poder subir imágenes.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`songs/${songId}/${crypto.randomUUID()}-${safeName}`, file, {
    access: "public",
  });

  const caption = formData.get("caption");
  await prisma.songReference.create({
    data: {
      songId,
      url: blob.url,
      caption: typeof caption === "string" && caption.trim() ? caption.trim() : null,
    },
  });
  revalidatePath(`/songs/${songId}`);
}

export async function removeSongReference(songId: string, id: string) {
  const userId = await requireUserId();
  const ref = await prisma.songReference.findFirst({
    where: { id, songId, song: { userId } },
  });
  if (!ref) return;

  await prisma.songReference.deleteMany({ where: { id, songId, song: { userId } } });

  if (isBlobConfigured()) {
    try {
      await del(ref.url);
    } catch {
      // El archivo puede ya no existir en el blob store; no bloquea el borrado en BD.
    }
  }
  revalidatePath(`/songs/${songId}`);
}
