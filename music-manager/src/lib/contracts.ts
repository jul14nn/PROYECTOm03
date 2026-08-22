/**
 * Acuerdo de reparto (el "split sheet" de toda la vida).
 *
 * Es el documento que fija quién cobra qué de una canción. Firmarlo el día
 * que se termina la canción cuesta cinco minutos; reconstruirlo dos años
 * después, cuando ya hay dinero de por medio y cada uno recuerda una cosa,
 * es de donde salen la mayoría de los líos entre colaboradores.
 *
 * Aquí solo vive la lógica de qué datos hacen falta y qué falta por rellenar.
 */

export type SplitKind = "OBRA" | "MASTER";

export const SPLIT_KINDS: {
  id: SplitKind;
  name: string;
  short: string;
  description: string;
  gestor: string;
}[] = [
  {
    id: "OBRA",
    name: "Obra (composición)",
    short: "Obra",
    description:
      "Quién escribió la canción: letra y música. Es lo que se reparte cada vez que suena en cualquier versión, incluso si la canta otro.",
    gestor: "SGAE (y la editorial, si la hay)",
  },
  {
    id: "MASTER",
    name: "Máster (grabación)",
    short: "Máster",
    description:
      "Quién hizo esta grabación concreta: intérpretes y productor. Es lo que se reparte de las escuchas de este audio en particular.",
    gestor: "AIE y AGEDI, o el sello",
  },
];

/** Datos que un acuerdo necesita de cada persona para poder firmarse. */
export const CAMPOS_PERSONA = [
  {
    key: "legalName" as const,
    label: "Nombre completo",
    hint: "Tal y como figura en el DNI, no el nombre artístico.",
    required: true,
  },
  {
    key: "taxId" as const,
    label: "DNI / NIE",
    hint: "Identifica a la persona sin ambigüedad si algún día hay que reclamar.",
    required: true,
  },
  {
    key: "address" as const,
    label: "Domicilio",
    hint: "Dirección a efectos de notificaciones.",
    required: true,
  },
  {
    key: "email" as const,
    label: "Email",
    hint: "Para enviarle su copia firmada.",
    required: true,
  },
  {
    key: "society" as const,
    label: "Entidad de gestión",
    hint: "SGAE para autores, AIE para intérpretes. Déjalo vacío si no está dado de alta.",
    required: false,
  },
  {
    key: "ipi" as const,
    label: "Número IPI / CAE",
    hint: "El número de socio en su entidad. Solo si está dado de alta.",
    required: false,
  },
  {
    key: "publisher" as const,
    label: "Editorial",
    hint: "Solo si tiene contrato de edición firmado.",
    required: false,
  },
];

export type DatosPersona = {
  legalName: string | null;
  taxId: string | null;
  address: string | null;
  email: string | null;
  society: string | null;
  ipi: string | null;
  publisher: string | null;
};

/** Campos obligatorios que le faltan a una persona. */
export function camposQueFaltan(p: DatosPersona | null): string[] {
  if (!p) return CAMPOS_PERSONA.filter((c) => c.required).map((c) => c.label);
  return CAMPOS_PERSONA.filter((c) => c.required && !p[c.key]).map((c) => c.label);
}

export type ParticipanteReparto = {
  id: string;
  name: string;
  role: string | null;
  kind: SplitKind;
  percentage: number;
  contacto: (DatosPersona & { id: string; name: string }) | null;
};

/** Suma de un reparto, con margen para los decimales del coma flotante. */
export function total(participantes: ParticipanteReparto[], kind: SplitKind) {
  const suma = participantes
    .filter((p) => p.kind === kind)
    .reduce((a, p) => a + p.percentage, 0);
  return Math.round(suma * 100) / 100;
}

export function sumaCien(n: number) {
  return Math.abs(n - 100) < 0.01;
}

export type Bloqueo = { texto: string; grave: boolean };

/**
 * Todo lo que impide firmar. `grave` distingue lo que invalida el documento
 * de lo que solo conviene revisar.
 */
export function bloqueos(
  participantes: ParticipanteReparto[],
  lugar: string | null
): Bloqueo[] {
  const out: Bloqueo[] = [];
  const obra = participantes.filter((p) => p.kind === "OBRA");
  const master = participantes.filter((p) => p.kind === "MASTER");

  if (obra.length === 0) {
    out.push({ texto: "No hay ningún autor en el reparto de obra.", grave: true });
  } else if (!sumaCien(total(participantes, "OBRA"))) {
    out.push({
      texto: `El reparto de obra suma ${total(participantes, "OBRA")}%, no 100%.`,
      grave: true,
    });
  }

  // El máster es opcional: hay canciones que solo formalizan la composición.
  if (master.length > 0 && !sumaCien(total(participantes, "MASTER"))) {
    out.push({
      texto: `El reparto de máster suma ${total(participantes, "MASTER")}%, no 100%.`,
      grave: true,
    });
  }

  for (const p of participantes) {
    if (!p.contacto) {
      out.push({
        texto: `«${p.name}» no está vinculado a un contacto, así que no tiene datos para firmar.`,
        grave: true,
      });
      continue;
    }
    const faltan = camposQueFaltan(p.contacto);
    if (faltan.length > 0) {
      out.push({
        texto: `A ${p.contacto.name} le faltan: ${faltan.join(", ")}.`,
        grave: true,
      });
    }
  }

  if (!lugar) {
    out.push({ texto: "Falta el lugar de firma.", grave: false });
  }

  return out;
}

export function porcentajeTexto(n: number) {
  return `${Number.isInteger(n) ? n : n.toFixed(2)}%`;
}
