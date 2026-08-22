"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { assertSongOwner } from "@/lib/actions/helpers";
import { revalidatePath } from "next/cache";

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
