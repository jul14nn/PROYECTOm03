"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { assertSongOwner } from "@/lib/actions/helpers";
import { revalidatePath } from "next/cache";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function addRoyalty(songId: string, formData: FormData) {
  const userId = await requireUserId();
  const name = str(formData, "name");
  if (!name) return;
  await assertSongOwner(songId, userId);
  await prisma.royalty.create({
    data: {
      songId,
      name,
      role: str(formData, "role"),
      contactId: str(formData, "contactId"),
      kind: str(formData, "kind") === "MASTER" ? "MASTER" : "OBRA",
      percentage: Number(str(formData, "percentage") ?? 0),
      notes: str(formData, "notes"),
    },
  });
  revalidatePath(`/songs/${songId}`);
  revalidatePath("/royalties");
}

export async function removeRoyalty(songId: string, id: string) {
  const userId = await requireUserId();
  await prisma.royalty.deleteMany({ where: { id, songId, song: { userId } } });
  revalidatePath(`/songs/${songId}`);
  revalidatePath("/royalties");
}

export async function addRoyaltyPayment(songId: string, royaltyId: string, formData: FormData) {
  const userId = await requireUserId();
  const amount = Number(str(formData, "amount") ?? 0);
  if (!amount) return;

  const royalty = await prisma.royalty.findFirst({
    where: { id: royaltyId, songId, song: { userId } },
    select: { id: true },
  });
  if (!royalty) throw new Error("Royalty no encontrado");

  await prisma.royaltyPayment.create({
    data: {
      royaltyId,
      amount,
      currency: str(formData, "currency") ?? "EUR",
      date: str(formData, "date") ? new Date(str(formData, "date")!) : new Date(),
      notes: str(formData, "notes"),
    },
  });
  revalidatePath(`/songs/${songId}`);
  revalidatePath("/royalties");
}

export async function removeRoyaltyPayment(songId: string, id: string) {
  const userId = await requireUserId();
  await prisma.royaltyPayment.deleteMany({
    where: { id, royalty: { songId, song: { userId } } },
  });
  revalidatePath(`/songs/${songId}`);
  revalidatePath("/royalties");
}
