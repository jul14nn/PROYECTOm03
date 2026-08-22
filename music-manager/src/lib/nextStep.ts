import { daysUntil } from "./tiktokPlan";

type NextStepInput = {
  needsCover: boolean;
  releaseDate: Date | string | null;
  stage: string;
  tasks: { status: string }[];
  distributionSteps: { status: string }[];
  marketingIdeas: { status: string }[];
  marketingBudgets: unknown[];
  royalties: { percentage: number }[];
  registeredAt?: Date | string | null;
  videoIdeas: unknown[];
  references: unknown[];
};

export type NextStep = {
  label: string;
  detail: string;
  tabId: string;
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
    tabId: string
  ): NextStep => ({
    label,
    detail,
    tabId,
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

  const hasMarketing = song.marketingIdeas.length > 0 || song.marketingBudgets.length > 0;
  if (!hasMarketing) {
    return step(
      SEVERITY.noMarketing,
      "No tienes plan de marketing todavía",
      "Genera uno automático según tu fecha — se rellena solo con ideas y presupuesto de partida.",
      "marketing"
    );
  }

  const pendingDistribution = song.distributionSteps.find((d) => d.status !== "HECHO");
  if (pendingDistribution) {
    return step(
      SEVERITY.distribution,
      "Quedan pasos con la distribuidora",
      "Revisa qué falta antes del lanzamiento en la pestaña de Producción.",
      "produccion"
    );
  }

  if (song.royalties.length === 0) {
    return step(
      SEVERITY.royaltiesMissing,
      "Sin reparto de royalties definido",
      "Deja anotado quién cobra qué porcentaje antes de que se te olvide.",
      "royalties"
    );
  }

  const royaltyTotal = song.royalties.reduce((a, r) => a + r.percentage, 0);
  if (royaltyTotal !== 100) {
    return step(
      SEVERITY.royaltiesWrong,
      `El reparto de royalties suma ${royaltyTotal}%, no 100%`,
      "Ajusta los porcentajes para que cuadren.",
      "royalties"
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
      "royalties"
    );
  }

  if (song.videoIdeas.length === 0 && song.references.length === 0) {
    return step(
      SEVERITY.noVisuals,
      "Sin ideas visuales todavía",
      "Apunta una idea de vídeo o sube una imagen de referencia para la sesión de brainstorming.",
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
