"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { LAUNCH_STEPS, dateForStep } from "@/lib/launchPlan";
import { NEXT_TASK_STATUS, type TaskStatus } from "@/lib/constants";
import { revalidatePath } from "next/cache";

/**
 * Vuelca el playbook completo sobre una canción, calculando la fecha real de
 * cada paso a partir de su fecha aproximada de lanzamiento.
 *
 * Se puede volver a lanzar sin miedo: `skipDuplicates` con la clave única
 * (songId, stepKey) evita duplicar pasos, así que regenerar tras mover la
 * fecha solo añade lo que falte.
 */
export async function generateLaunchPlan(songId: string) {
  const userId = await requireUserId();
  const song = await prisma.song.findFirst({ where: { id: songId, userId } });
  if (!song) throw new Error("Canción no encontrada");

  // Si la fecha está encima, los pasos de hace semanas nacerían ya vencidos.
  // Crear 18 tareas tarde el primer día no ayuda a nadie: se omiten las que
  // ya no se pueden hacer y el plan empieza donde de verdad estás.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const steps = song.releaseDate
    ? LAUNCH_STEPS.filter((s) => dateForStep(song.releaseDate!, s.day) >= today)
    : LAUNCH_STEPS;

  await prisma.launchTask.createMany({
    data: steps.map((s) => ({
      songId,
      stepKey: s.key,
      title: s.title,
      detail: s.detail,
      phase: s.phase,
      channel: s.channel,
      dayOffset: s.day,
      dueDate: song.releaseDate ? dateForStep(song.releaseDate, s.day) : null,
      cost: s.cost ?? null,
    })),
    skipDuplicates: true,
  });

  revalidatePath(`/songs/${songId}`);
  revalidatePath("/marketing");
}

/**
 * Recalcula las fechas de todos los pasos. Necesario cuando se mueve la fecha
 * aproximada: si no, el plan seguiría apuntando a los días de la fecha vieja.
 */
export async function resyncLaunchPlan(songId: string) {
  const userId = await requireUserId();
  const song = await prisma.song.findFirst({
    where: { id: songId, userId },
    include: { launchTasks: true },
  });
  if (!song) throw new Error("Canción no encontrada");

  await prisma.$transaction(
    song.launchTasks.map((t) =>
      prisma.launchTask.update({
        where: { id: t.id },
        data: {
          dueDate: song.releaseDate ? dateForStep(song.releaseDate, t.dayOffset) : null,
        },
      })
    )
  );

  revalidatePath(`/songs/${songId}`);
  revalidatePath("/marketing");
}

export async function cycleLaunchTask(songId: string, id: string, status: string) {
  const userId = await requireUserId();
  const next = NEXT_TASK_STATUS[status as TaskStatus] ?? "PENDIENTE";
  await prisma.launchTask.updateMany({
    where: { id, songId, song: { userId } },
    data: { status: next as never },
  });
  revalidatePath(`/songs/${songId}`);
  revalidatePath("/marketing");
}

export async function clearLaunchPlan(songId: string) {
  const userId = await requireUserId();
  await prisma.launchTask.deleteMany({ where: { songId, song: { userId } } });
  revalidatePath(`/songs/${songId}`);
  revalidatePath("/marketing");
}
