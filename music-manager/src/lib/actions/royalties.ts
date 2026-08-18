"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function addRoyalty(songId: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) return;
  await prisma.royalty.create({
    data: {
      songId,
      name,
      role: str(formData, "role"),
      contactId: str(formData, "contactId"),
      percentage: Number(str(formData, "percentage") ?? 0),
      notes: str(formData, "notes"),
    },
  });
  revalidatePath(`/songs/${songId}`);
  revalidatePath("/royalties");
}

export async function removeRoyalty(songId: string, id: string) {
  await prisma.royalty.delete({ where: { id } });
  revalidatePath(`/songs/${songId}`);
  revalidatePath("/royalties");
}

export async function addRoyaltyPayment(songId: string, royaltyId: string, formData: FormData) {
  const amount = Number(str(formData, "amount") ?? 0);
  if (!amount) return;
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
  await prisma.royaltyPayment.delete({ where: { id } });
  revalidatePath(`/songs/${songId}`);
  revalidatePath("/royalties");
}
