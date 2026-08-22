"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { assertSongOwner } from "@/lib/actions/helpers";
import { revalidatePath } from "next/cache";
import { sendAppEmail, isEmailConfigured } from "@/lib/email/mailer";
import { agreementEmailHtml } from "@/lib/agreementEmail";
import { bloqueos, type ParticipanteReparto, type SplitKind } from "@/lib/contracts";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

/** Datos legales del contacto: se escriben una vez y valen para todas sus canciones. */
export async function saveContactLegal(
  contactId: string,
  songId: string,
  formData: FormData
) {
  const userId = await requireUserId();
  await prisma.contact.updateMany({
    where: { id: contactId, userId },
    data: {
      legalName: str(formData, "legalName"),
      taxId: str(formData, "taxId"),
      address: str(formData, "address"),
      email: str(formData, "email"),
      society: str(formData, "society"),
      ipi: str(formData, "ipi"),
      publisher: str(formData, "publisher"),
    },
  });
  revalidatePath(`/songs/${songId}/contrato`);
  revalidatePath("/contacts");
}

/** Lugar y fecha del acuerdo. La fecha se fija: si cambiara sola, el documento
 *  firmado y el que se ve en pantalla dejarían de coincidir. */
export async function saveAgreementMeta(songId: string, formData: FormData) {
  const userId = await requireUserId();
  await assertSongOwner(songId, userId);
  const fecha = str(formData, "agreementDate");
  await prisma.song.updateMany({
    where: { id: songId, userId },
    data: {
      agreementPlace: str(formData, "agreementPlace"),
      agreementDate: fecha ? new Date(fecha) : null,
      isrc: str(formData, "isrc"),
    },
  });
  revalidatePath(`/songs/${songId}/contrato`);
}

/** Crea un contacto desde el cuestionario y lo enlaza a esa línea del reparto,
 *  para no obligar a salir a Contactos y volver. */
export async function linkRoyaltyToNewContact(
  songId: string,
  royaltyId: string,
  formData: FormData
) {
  const userId = await requireUserId();
  await assertSongOwner(songId, userId);
  const royalty = await prisma.royalty.findFirst({
    where: { id: royaltyId, songId },
    select: { name: true, role: true },
  });
  if (!royalty) return;

  const contact = await prisma.contact.create({
    data: {
      userId,
      name: str(formData, "name") ?? royalty.name,
      role: royalty.role,
      legalName: str(formData, "legalName"),
      taxId: str(formData, "taxId"),
      address: str(formData, "address"),
      email: str(formData, "email"),
    },
  });
  await prisma.royalty.updateMany({
    where: { id: royaltyId, songId },
    data: { contactId: contact.id },
  });
  revalidatePath(`/songs/${songId}/contrato`);
  revalidatePath("/contacts");
}

/** Enlaza la línea con un contacto que ya existe. */
export async function linkRoyaltyToContact(
  songId: string,
  royaltyId: string,
  formData: FormData
) {
  const userId = await requireUserId();
  await assertSongOwner(songId, userId);
  const contactId = str(formData, "contactId");
  if (!contactId) return;
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
    select: { id: true },
  });
  if (!contact) return;
  await prisma.royalty.updateMany({
    where: { id: royaltyId, songId },
    data: { contactId: contact.id },
  });
  revalidatePath(`/songs/${songId}/contrato`);
}

/** Mueve una línea entre el reparto de obra y el de máster. */
export async function setRoyaltyKind(
  songId: string,
  royaltyId: string,
  kind: "OBRA" | "MASTER"
) {
  const userId = await requireUserId();
  await assertSongOwner(songId, userId);
  await prisma.royalty.updateMany({ where: { id: royaltyId, songId }, data: { kind } });
  revalidatePath(`/songs/${songId}/contrato`);
  revalidatePath(`/songs/${songId}`);
}

/** Copia el reparto de obra al de máster, que es como suele empezar: los
 *  mismos nombres con los mismos porcentajes, y luego se ajusta. */
export async function copyObraToMaster(songId: string) {
  const userId = await requireUserId();
  await assertSongOwner(songId, userId);
  const obra = await prisma.royalty.findMany({ where: { songId, kind: "OBRA" } });
  const yaHayMaster = await prisma.royalty.count({ where: { songId, kind: "MASTER" } });
  if (yaHayMaster > 0) return;
  await prisma.royalty.createMany({
    data: obra.map((r) => ({
      songId,
      contactId: r.contactId,
      name: r.name,
      role: r.role,
      kind: "MASTER" as const,
      percentage: r.percentage,
    })),
  });
  revalidatePath(`/songs/${songId}/contrato`);
  revalidatePath(`/songs/${songId}`);
}

const FECHA_LARGA = new Intl.DateTimeFormat("es-ES", { dateStyle: "long" });

/**
 * Envía el acuerdo a cada firmante que tenga email.
 *
 * Devuelve un resultado en vez de lanzar: enviar correo falla por motivos
 * ajenos a quien pulsa el botón (credenciales, límites del proveedor), y una
 * pantalla de error genérica no le diría nada.
 */
export async function sendAgreement(
  songId: string
): Promise<{ ok: boolean; mensaje: string }> {
  const userId = await requireUserId();

  if (!isEmailConfigured()) {
    return {
      ok: false,
      mensaje:
        "El envío de correo no está configurado en este despliegue (faltan las variables SMTP).",
    };
  }

  const song = await prisma.song.findFirst({
    where: { id: songId, userId },
    include: { royalties: { include: { contact: true }, orderBy: { percentage: "desc" } } },
  });
  if (!song) return { ok: false, mensaje: "Canción no encontrada." };

  const participantes: ParticipanteReparto[] = song.royalties.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    kind: r.kind as SplitKind,
    percentage: r.percentage,
    contacto: r.contact
      ? {
          id: r.contact.id,
          name: r.contact.name,
          legalName: r.contact.legalName,
          taxId: r.contact.taxId,
          address: r.contact.address,
          email: r.contact.email,
          society: r.contact.society,
          ipi: r.contact.ipi,
          publisher: r.contact.publisher,
        }
      : null,
  }));

  // No se manda un acuerdo a medias: sería peor que no mandarlo.
  const graves = bloqueos(participantes, song.agreementPlace).filter((b) => b.grave);
  if (graves.length > 0) {
    return { ok: false, mensaje: "El acuerdo todavía no está completo." };
  }

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const destinatarios = Array.from(
    new Map(
      song.royalties
        .filter((r) => r.contact?.email)
        .map((r) => [r.contact!.email!, r.contact!.name])
    ).entries()
  );
  if (destinatarios.length === 0) {
    return { ok: false, mensaje: "Ningún firmante tiene email." };
  }

  const html = agreementEmailHtml({
    songTitle: song.title,
    genre: song.genre,
    isrc: song.isrc,
    lugar: song.agreementPlace ?? "—",
    fecha: song.agreementDate ? FECHA_LARGA.format(song.agreementDate) : "—",
    remitente: usuario?.name ?? usuario?.email ?? "El artista",
    lineas: song.royalties.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      kind: r.kind as SplitKind,
      percentage: r.percentage,
      contact: r.contact
        ? { legalName: r.contact.legalName, taxId: r.contact.taxId, society: r.contact.society }
        : null,
    })),
  });

  const fallos: string[] = [];
  for (const [email, nombre] of destinatarios) {
    try {
      await sendAppEmail({
        to: email,
        subject: `Reparto de «${song.title}»`,
        html,
      });
    } catch (err) {
      console.error(`[music-manager] No se pudo enviar el acuerdo a ${email}:`, err);
      fallos.push(nombre);
    }
  }

  const enviados = destinatarios.length - fallos.length;
  if (enviados > 0) {
    await prisma.song.updateMany({
      where: { id: songId, userId },
      data: { agreementSentAt: new Date() },
    });
  }
  revalidatePath(`/songs/${songId}/contrato`);
  revalidatePath(`/songs/${songId}/contrato/documento`);

  if (fallos.length > 0) {
    return {
      ok: enviados > 0,
      mensaje:
        enviados > 0
          ? `Enviado a ${enviados}, pero falló con ${fallos.join(", ")}.`
          : "No se pudo enviar a nadie. Revisa los registros del despliegue.",
    };
  }
  return {
    ok: true,
    mensaje: `Enviado a ${enviados} ${enviados === 1 ? "persona" : "personas"}.`,
  };
}
