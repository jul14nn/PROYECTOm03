import { daysUntil } from "./tiktokPlan";

type NextStepInput = {
  needsCover: boolean;
  releaseDate: Date | string | null;
  stage: string;
  tasks: { status: string }[];
  launchTasks: { status: string; channel: string | null; dayOffset: number }[];
  royalties: { percentage: number }[];
  registeredAt?: Date | string | null;
  references: unknown[];
};

export type NextStep = {
  label: string;
  detail: string;
  tabId: string;
  /** Si el paso se hace fuera de la ficha, a dónde lleva. */
  href?: string;
  /** Mayor = más urgente. Permite ordenar pasos de canciones distintas entre sí. */
  priority: number;
  /** Días hasta la fecha aproximada (negativo si ya pasó, null si no hay fecha). */
  daysToRelease: number | null;
  /** true cuando no queda nada urgente por hacer. */
  done: boolean;
};

/** Cuánto bloquea cada tipo de cabo suelto, independientemente de la fecha. */
const SEVERITY = {
  distribution: 75,
  cover: 70,
  royaltiesWrong: 60,
  royaltiesMissing: 55,
  notRegistered: 52,
  noDate: 50,
  noMarketing: 45,
  tasks: 40,
  noVisuals: 30,
} as const;

/**
 * Lo cerca que está el lanzamiento sube la urgencia de cualquier cabo suelto:
 * "falta la portada" a 5 días del lanzamiento no es lo mismo que a 3 meses.
 */
function urgencyBoost(days: number | null): number {
  if (days === null) return 0;
  if (days < 0) return 45; // ya debería haber salido y sigue habiendo cabos sueltos
  if (days <= 3) return 50;
  if (days <= 7) return 40;
  if (days <= 14) return 25;
  if (days <= 30) return 12;
  return 0;
}

/**
 * Calcula UNA sola recomendación (la más urgente) en vez de obligar a
 * repasar todas las secciones — pensado para alguien sin mucho tiempo
 * o paciencia para gestionar el catálogo entero de golpe.
 */
export function getNextStep(song: NextStepInput): NextStep {
  const release = song.releaseDate
    ? typeof song.releaseDate === "string"
      ? new Date(song.releaseDate)
      : song.releaseDate
    : null;
  const daysToRelease = release ? daysUntil(release) : null;
  const boost = urgencyBoost(daysToRelease);

  const step = (
    severity: number,
    label: string,
    detail: string,
    tabId: string,
    href?: string
  ): NextStep => ({
    label,
    detail,
    tabId,
    href,
    priority: severity + boost,
    daysToRelease,
    done: false,
  });

  if (song.needsCover) {
    return step(
      SEVERITY.cover,
      "Falta la portada",
      "Sube o marca la portada como lista — es lo primero que verá cualquiera antes de escuchar la canción.",
      "info"
    );
  }

  const pendingTask = song.tasks.find((t) => t.status === "PENDIENTE");
  if (pendingTask) {
    return step(
      SEVERITY.tasks,
      "Tienes gestiones previas sin cerrar",
      "Revisa la lista de pre-producción y tacha lo que ya esté hecho.",
      "produccion"
    );
  }

  if (!song.releaseDate) {
    return step(
      SEVERITY.noDate,
      "Aún no tienes fecha aproximada",
      "Ponle una fecha orientativa — desbloquea el plan de TikTok y los avisos automáticos.",
      "info"
    );
  }

  if (song.launchTasks.length === 0) {
    return step(
      SEVERITY.noMarketing,
      "No tienes plan de lanzamiento todavía",
      "Genéralo desde tu fecha: 32 pasos con fecha propia, del máster al balance del mes siguiente.",
      "marketing"
    );
  }

  // Los pasos de distribuidora ya no son una lista aparte: son los del plan
  // de lanzamiento con ese canal, que además vienen con fecha calculada.
  const pendingDistribution = song.launchTasks.find(
    (t) => t.channel === "Distribuidora" && t.status !== "HECHO"
  );
  if (pendingDistribution) {
    return step(
      SEVERITY.distribution,
      "Quedan pasos con la distribuidora",
      "Revisa qué falta antes del lanzamiento en la pestaña de Marketing.",
      "marketing"
    );
  }

  if (song.royalties.length === 0) {
    return step(
      SEVERITY.royaltiesMissing,
      "Sin reparto de royalties definido",
      "Deja anotado quién cobra qué porcentaje antes de que se te olvide.",
      "info",
      "/royalties"
    );
  }

  const royaltyTotal = song.royalties.reduce((a, r) => a + r.percentage, 0);
  if (royaltyTotal !== 100) {
    return step(
      SEVERITY.royaltiesWrong,
      `El reparto de royalties suma ${royaltyTotal}%, no 100%`,
      "Ajusta los porcentajes para que cuadren.",
      "info",
      "/royalties"
    );
  }

  // Con el reparto ya cuadrado, lo siguiente es declararlo: los porcentajes
  // que se registran son los que después se cobran, y lo que suena sin
  // registrar no lo cobra nadie.
  if (!song.registeredAt) {
    return step(
      SEVERITY.notRegistered,
      "La obra no está declarada en tu entidad de gestión",
      "El reparto ya cuadra, así que puedes registrarla. Lo que suena sin registrar no lo cobra nadie.",
      "info",
      "/guias/sgae"
    );
  }

  if (song.references.length === 0) {
    return step(
      SEVERITY.noVisuals,
      "Sin referencias visuales todavía",
      "Sube una imagen que te sirva de guía: portadas que te gusten, paletas, fotogramas.",
      "contenido"
    );
  }

  return {
    label: "Todo en orden por ahora",
    detail: "No hay ningún cabo suelto urgente — sigue avanzando a tu ritmo.",
    tabId: "info",
    priority: 0,
    daysToRelease,
    done: true,
  };
}
