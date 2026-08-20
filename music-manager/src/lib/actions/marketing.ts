"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { assertSongOwner } from "@/lib/actions/helpers";
import { revalidatePath } from "next/cache";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function addBudgetItem(songId: string, formData: FormData) {
  const userId = await requireUserId();
  const category = str(formData, "category");
  if (!category) return;
  await assertSongOwner(songId, userId);
  await prisma.marketingBudgetItem.create({
    data: {
      songId,
      category,
      plannedAmount: Number(str(formData, "plannedAmount") ?? 0),
      actualAmount: Number(str(formData, "actualAmount") ?? 0),
      currency: str(formData, "currency") ?? "EUR",
      notes: str(formData, "notes"),
    },
  });
  revalidatePath(`/songs/${songId}`);
}

export async function removeBudgetItem(songId: string, id: string) {
  const userId = await requireUserId();
  await prisma.marketingBudgetItem.deleteMany({ where: { id, songId, song: { userId } } });
  revalidatePath(`/songs/${songId}`);
}

export async function addMarketingIdea(songId: string, formData: FormData) {
  const userId = await requireUserId();
  const title = str(formData, "title");
  if (!title) return;
  await assertSongOwner(songId, userId);
  await prisma.marketingIdea.create({
    data: {
      songId,
      title,
      description: str(formData, "description"),
      channel: str(formData, "channel"),
    },
  });
  revalidatePath(`/songs/${songId}`);
}

export async function toggleMarketingIdea(songId: string, id: string, status: string) {
  const userId = await requireUserId();
  await prisma.marketingIdea.updateMany({
    where: { id, songId, song: { userId } },
    data: { status: status as never },
  });
  revalidatePath(`/songs/${songId}`);
}

export async function removeMarketingIdea(songId: string, id: string) {
  const userId = await requireUserId();
  await prisma.marketingIdea.deleteMany({ where: { id, songId, song: { userId } } });
  revalidatePath(`/songs/${songId}`);
}
