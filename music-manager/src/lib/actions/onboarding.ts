"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function setUserName(formData: FormData) {
  const userId = await requireUserId();
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) return;

  await prisma.user.update({
    where: { id: userId },
    data: { name: name.trim().slice(0, 60) },
  });

  redirect("/");
}
