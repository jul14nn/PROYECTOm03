"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createContact(formData: FormData) {
  const userId = await requireUserId();
  const name = str(formData, "name");
  if (!name) throw new Error("El nombre es obligatorio");
  await prisma.contact.create({
    data: {
      userId,
      name,
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      role: str(formData, "role"),
      notes: str(formData, "notes"),
    },
  });
  revalidatePath("/contacts");
}

export async function updateContact(id: string, formData: FormData) {
  const userId = await requireUserId();
  const name = str(formData, "name");
  if (!name) throw new Error("El nombre es obligatorio");
  await prisma.contact.updateMany({
    where: { id, userId },
    data: {
      name,
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      role: str(formData, "role"),
      notes: str(formData, "notes"),
    },
  });
  revalidatePath("/contacts");
}

export async function deleteContact(id: string) {
  const userId = await requireUserId();
  await prisma.contact.deleteMany({ where: { id, userId } });
  revalidatePath("/contacts");
}
