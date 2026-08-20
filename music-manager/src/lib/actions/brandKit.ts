"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function str(fd: FormData, key: string, fallback: string) {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : fallback;
}

function num(fd: FormData, key: string, fallback: number, min: number, max: number) {
  const v = Number(fd.get(key));
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

export async function saveBrandKit(formData: FormData) {
  const userId = await requireUserId();

  const data = {
    primaryColor: str(formData, "primaryColor", "#9333ea"),
    secondaryColor: str(formData, "secondaryColor", "#e0299e"),
    fontFamily: str(formData, "fontFamily", "Anton"),
    subtitleStyle: str(formData, "subtitleStyle", "barra"),
    subtitlePosPct: num(formData, "subtitlePosPct", 78, 40, 92),
    subtitleScale: num(formData, "subtitleScale", 1, 0.7, 1.5),
    defaultVideoStyle: str(formData, "defaultVideoStyle", "neon"),
  };

  await prisma.brandKit.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  revalidatePath("/ajustes");
  revalidatePath("/songs", "layout");
}
