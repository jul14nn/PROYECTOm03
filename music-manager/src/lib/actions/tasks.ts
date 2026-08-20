"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { assertSongOwner } from "@/lib/actions/helpers";
import { revalidatePath } from "next/cache";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

// --- Pre-production tasks ---
export async function addTask(songId: string, formData: FormData) {
  const userId = await requireUserId();
  const title = str(formData, "title");
  if (!title) return;
  await assertSongOwner(songId, userId);
  await prisma.preProductionTask.create({
    data: {
      songId,
      title,
      assignee: str(formData, "assignee"),
      dueDate: str(formData, "dueDate") ? new Date(str(formData, "dueDate")!) : null,
    },
  });
  revalidatePath(`/songs/${songId}`);
}

export async function cycleTaskStatus(songId: string, id: string, next: string) {
  const userId = await requireUserId();
  await prisma.preProductionTask.updateMany({
    where: { id, songId, song: { userId } },
    data: { status: next as never },
  });
  revalidatePath(`/songs/${songId}`);
}

export async function removeTask(songId: string, id: string) {
  const userId = await requireUserId();
  await prisma.preProductionTask.deleteMany({ where: { id, songId, song: { userId } } });
  revalidatePath(`/songs/${songId}`);
}

// --- Distribution steps ---
export async function addDistributionStep(songId: string, formData: FormData) {
  const userId = await requireUserId();
  const distributor = str(formData, "distributor");
  const step = str(formData, "step");
  if (!distributor || !step) return;
  await assertSongOwner(songId, userId);
  await prisma.distributionStep.create({
    data: {
      songId,
      distributor,
      step,
      dueDate: str(formData, "dueDate") ? new Date(str(formData, "dueDate")!) : null,
      notes: str(formData, "notes"),
    },
  });
  revalidatePath(`/songs/${songId}`);
}

export async function cycleDistributionStatus(songId: string, id: string, next: string) {
  const userId = await requireUserId();
  await prisma.distributionStep.updateMany({
    where: { id, songId, song: { userId } },
    data: { status: next as never },
  });
  revalidatePath(`/songs/${songId}`);
  revalidatePath("/distribution");
}

export async function removeDistributionStep(songId: string, id: string) {
  const userId = await requireUserId();
  await prisma.distributionStep.deleteMany({ where: { id, songId, song: { userId } } });
  revalidatePath(`/songs/${songId}`);
}
