import { prisma } from "@/lib/prisma";

/** Lanza si la canción no existe o no pertenece al usuario. */
export async function assertSongOwner(songId: string, userId: string) {
  const song = await prisma.song.findFirst({ where: { id: songId, userId }, select: { id: true } });
  if (!song) throw new Error("Canción no encontrada");
}
