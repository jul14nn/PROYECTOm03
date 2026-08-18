"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function addBudgetItem(songId: string, formData: FormData) {
  const category = str(formData, "category");
  if (!category) return;
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
  await prisma.marketingBudgetItem.delete({ where: { id } });
  revalidatePath(`/songs/${songId}`);
}

export async function addMarketingIdea(songId: string, formData: FormData) {
  const title = str(formData, "title");
  if (!title) return;
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
  await prisma.marketingIdea.update({ where: { id }, data: { status: status as never } });
  revalidatePath(`/songs/${songId}`);
}

export async function removeMarketingIdea(songId: string, id: string) {
  await prisma.marketingIdea.delete({ where: { id } });
  revalidatePath(`/songs/${songId}`);
}
