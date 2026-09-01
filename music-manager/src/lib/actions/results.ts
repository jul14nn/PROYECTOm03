"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { assertSongOwner } from "@/lib/actions/helpers";
import { revalidatePath } from "next/cache";
import { parseNumero } from "@/lib/results";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

/** Los números llegan del portapapeles y vienen con puntos, comas o "12,4k". */
function num(fd: FormData, key: string) {
  return parseNumero(str(fd, key));
}

export async function addPost(formData: FormData) {
  const userId = await requireUserId();
  const format = str(formData, "format");
  if (!format) return;

  const songId = str(formData, "songId");
  if (songId) await assertSongOwner(songId, userId);

  const fecha = str(formData, "postedAt");

  await prisma.contentPost.create({
    data: {
      userId,
      songId,
      platform: (str(formData, "platform") ?? "TIKTOK") as never,
      format,
      postedAt: fecha ? new Date(fecha) : new Date(),
      url: str(formData, "url"),
      views: num(formData, "views"),
      likes: num(formData, "likes"),
      comments: num(formData, "comments"),
      shares: num(formData, "shares"),
      saves: num(formData, "saves"),
      notes: str(formData, "notes"),
    },
  });

  revalidatePath("/resultados");
  if (songId) revalidatePath(`/songs/${songId}`);
}

export async function removePost(id: string) {
  const userId = await requireUserId();
  await prisma.contentPost.deleteMany({ where: { id, userId } });
  revalidatePath("/resultados");
}

/** Actualiza los números de una publicación ya registrada: crecen con el tiempo. */
export async function updatePostNumbers(id: string, formData: FormData) {
  const userId = await requireUserId();
  await prisma.contentPost.updateMany({
    where: { id, userId },
    data: {
      views: num(formData, "views"),
      likes: num(formData, "likes"),
      comments: num(formData, "comments"),
      shares: num(formData, "shares"),
      saves: num(formData, "saves"),
    },
  });
  revalidatePath("/resultados");
}

export async function addSnapshot(songId: string, formData: FormData) {
  const userId = await requireUserId();
  await assertSongOwner(songId, userId);
  const fecha = str(formData, "takenAt");
  await prisma.songSnapshot.create({
    data: {
      songId,
      takenAt: fecha ? new Date(fecha) : new Date(),
      streams: num(formData, "streams"),
      listeners: num(formData, "listeners"),
      saves: num(formData, "saves"),
      playlists: num(formData, "playlists"),
      notes: str(formData, "notes"),
    },
  });
  revalidatePath("/resultados");
  revalidatePath(`/songs/${songId}`);
}

export async function removeSnapshot(id: string, songId: string) {
  const userId = await requireUserId();
  await prisma.songSnapshot.deleteMany({ where: { id, song: { userId } } });
  revalidatePath("/resultados");
  revalidatePath(`/songs/${songId}`);
}
