"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createContact(formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("El nombre es obligatorio");
  await prisma.contact.create({
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

export async function updateContact(id: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("El nombre es obligatorio");
  await prisma.contact.update({
    where: { id },
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
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
}
