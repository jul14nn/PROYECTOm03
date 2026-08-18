"use server";

import { prisma } from "@/lib/prisma";
import { sendInviteEmail, isEmailConfigured } from "@/lib/email/mailer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createEvent(formData: FormData) {
  const title = str(formData, "title");
  const startDate = str(formData, "startDate");
  if (!title || !startDate) throw new Error("Título y fecha de inicio son obligatorios");

  const emailsRaw = str(formData, "inviteEmails") ?? "";
  const emails = emailsRaw
    .split(/[,;\n]/)
    .map((e) => e.trim())
    .filter(Boolean);

  const event = await prisma.calendarEvent.create({
    data: {
      title,
      description: str(formData, "description"),
      location: str(formData, "location"),
      startDate: new Date(startDate),
      endDate: str(formData, "endDate") ? new Date(str(formData, "endDate")!) : null,
      songId: str(formData, "songId"),
      invites: {
        create: emails.map((email) => ({ email })),
      },
    },
  });

  revalidatePath("/calendar");
  redirect(`/calendar/${event.id}`);
}

export async function deleteEvent(id: string) {
  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath("/calendar");
  redirect("/calendar");
}

export async function addInvite(eventId: string, formData: FormData) {
  const email = str(formData, "email");
  if (!email) return;
  await prisma.eventInvite.create({
    data: { eventId, email, contactId: str(formData, "contactId") },
  });
  revalidatePath(`/calendar/${eventId}`);
}

export async function removeInvite(eventId: string, inviteId: string) {
  await prisma.eventInvite.delete({ where: { id: inviteId } });
  revalidatePath(`/calendar/${eventId}`);
}

export async function sendInvite(eventId: string, inviteId: string) {
  const event = await prisma.calendarEvent.findUniqueOrThrow({ where: { id: eventId } });
  const invite = await prisma.eventInvite.findUniqueOrThrow({ where: { id: inviteId } });

  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(event.startDate);

  try {
    await sendInviteEmail({
      to: invite.email,
      subject: `Invitación: ${event.title}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5;">
          <h2>${event.title}</h2>
          <p><strong>Fecha:</strong> ${formattedDate}</p>
          ${event.location ? `<p><strong>Ubicación:</strong> ${event.location}</p>` : ""}
          ${event.description ? `<p>${event.description}</p>` : ""}
          <p>Has sido invitado/a a este evento de producción musical.</p>
        </div>
      `,
    });
    await prisma.eventInvite.update({
      where: { id: inviteId },
      data: { status: "ENVIADA", sentAt: new Date() },
    });
    revalidatePath(`/calendar/${eventId}`);
    return { ok: true as const };
  } catch (err) {
    revalidatePath(`/calendar/${eventId}`);
    return { ok: false as const, error: (err as Error).message };
  }
}

export async function sendAllPendingInvites(eventId: string) {
  const invites = await prisma.eventInvite.findMany({
    where: { eventId, status: "PENDIENTE" },
  });
  const results = [];
  for (const invite of invites) {
    results.push(await sendInvite(eventId, invite.id));
  }
  return { emailConfigured: isEmailConfigured(), results };
}
