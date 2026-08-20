"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { assertSongOwner } from "@/lib/actions/helpers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createSong(formData: FormData) {
  const userId = await requireUserId();
  const title = str(formData, "title");
  if (!title) throw new Error("El título es obligatorio");

  const song = await prisma.song.create({
    data: {
      userId,
      title,
      genre: str(formData, "genre"),
      color: str(formData, "color") ?? "#6366f1",
      stage: (str(formData, "stage") as never) ?? "IDEA",
      needsCover: formData.get("needsCover") === "on",
      bpm: str(formData, "bpm") ? Number(str(formData, "bpm")) : null,
      key: str(formData, "key"),
      notes: str(formData, "notes"),
      releaseDate: str(formData, "releaseDate")
        ? new Date(str(formData, "releaseDate")!)
        : null,
    },
  });

  revalidatePath("/songs");
  redirect(`/songs/${song.id}`);
}

export async function updateSong(songId: string, formData: FormData) {
  const userId = await requireUserId();
  const title = str(formData, "title");
  if (!title) throw new Error("El título es obligatorio");

  await prisma.song.updateMany({
    where: { id: songId, userId },
    data: {
      title,
      genre: str(formData, "genre"),
      color: str(formData, "color") ?? "#6366f1",
      stage: (str(formData, "stage") as never) ?? "IDEA",
      needsCover: formData.get("needsCover") === "on",
      coverUrl: str(formData, "coverUrl"),
      bpm: str(formData, "bpm") ? Number(str(formData, "bpm")) : null,
      key: str(formData, "key"),
      notes: str(formData, "notes"),
      releaseDate: str(formData, "releaseDate")
        ? new Date(str(formData, "releaseDate")!)
        : null,
    },
  });

  revalidatePath("/songs");
  revalidatePath(`/songs/${songId}`);
}

export async function updateSongStage(songId: string, stage: string) {
  const userId = await requireUserId();
  await prisma.song.updateMany({ where: { id: songId, userId }, data: { stage: stage as never } });
  revalidatePath("/songs");
  revalidatePath(`/songs/${songId}`);
}

export async function deleteSong(songId: string) {
  const userId = await requireUserId();
  await prisma.song.deleteMany({ where: { id: songId, userId } });
  revalidatePath("/songs");
  redirect("/songs");
}

// --- Featuring ---
export async function addFeaturing(songId: string, formData: FormData) {
  const userId = await requireUserId();
  const artistName = str(formData, "artistName");
  if (!artistName) return;
  await assertSongOwner(songId, userId);
  await prisma.songFeaturing.create({
    data: {
      songId,
      artistName,
      role: str(formData, "role"),
      contactId: str(formData, "contactId"),
      confirmed: formData.get("confirmed") === "on",
    },
  });
  revalidatePath(`/songs/${songId}`);
}

export async function removeFeaturing(songId: string, featuringId: string) {
  const userId = await requireUserId();
  await prisma.songFeaturing.deleteMany({
    where: { id: featuringId, songId, song: { userId } },
  });
  revalidatePath(`/songs/${songId}`);
}

// --- Producers ---
export async function addProducer(songId: string, formData: FormData) {
  const userId = await requireUserId();
  const contactId = str(formData, "contactId");
  if (!contactId) return;
  await assertSongOwner(songId, userId);
  await prisma.songProducer.create({
    data: { songId, contactId, role: str(formData, "role") },
  });
  revalidatePath(`/songs/${songId}`);
}

export async function removeProducer(songId: string, songProducerId: string) {
  const userId = await requireUserId();
  await prisma.songProducer.deleteMany({
    where: { id: songProducerId, songId, song: { userId } },
  });
  revalidatePath(`/songs/${songId}`);
}

// --- Video ideas ---
export async function addVideoIdea(songId: string, formData: FormData) {
  const userId = await requireUserId();
  const title = str(formData, "title");
  if (!title) return;
  await assertSongOwner(songId, userId);
  await prisma.videoIdea.create({
    data: {
      songId,
      title,
      description: str(formData, "description"),
      referenceUrl: str(formData, "referenceUrl"),
    },
  });
  revalidatePath(`/songs/${songId}`);
}

export async function toggleVideoIdea(songId: string, id: string, status: string) {
  const userId = await requireUserId();
  await prisma.videoIdea.updateMany({
    where: { id, songId, song: { userId } },
    data: { status: status as never },
  });
  revalidatePath(`/songs/${songId}`);
}

export async function removeVideoIdea(songId: string, id: string) {
  const userId = await requireUserId();
  await prisma.videoIdea.deleteMany({ where: { id, songId, song: { userId } } });
  revalidatePath(`/songs/${songId}`);
}
