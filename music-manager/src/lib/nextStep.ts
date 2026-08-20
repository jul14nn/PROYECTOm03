type NextStepInput = {
  needsCover: boolean;
  releaseDate: Date | string | null;
  stage: string;
  tasks: { status: string }[];
  distributionSteps: { status: string }[];
  marketingIdeas: { status: string }[];
  marketingBudgets: unknown[];
  royalties: { percentage: number }[];
  videoIdeas: unknown[];
  references: unknown[];
};

export type NextStep = {
  label: string;
  detail: string;
  tabId: string;
};

/**
 * Calcula UNA sola recomendación (la más urgente) en vez de obligar a
 * repasar todas las secciones — pensado para alguien sin mucho tiempo
 * o paciencia para gestionar el catálogo entero de golpe.
 */
export function getNextStep(song: NextStepInput): NextStep {
  if (song.needsCover) {
    return {
      label: "Falta la portada",
      detail: "Sube o marca la portada como lista — es lo primero que verá cualquiera antes de escuchar la canción.",
      tabId: "info",
    };
  }

  const pendingTask = song.tasks.find((t) => t.status === "PENDIENTE");
  if (pendingTask) {
    return {
      label: "Tienes gestiones previas sin cerrar",
      detail: "Revisa la lista de pre-producción y tacha lo que ya esté hecho.",
      tabId: "produccion",
    };
  }

  if (!song.releaseDate) {
    return {
      label: "Aún no tienes fecha aproximada",
      detail: "Ponle una fecha orientativa — desbloquea el plan de TikTok y los avisos automáticos.",
      tabId: "info",
    };
  }

  const hasMarketing = song.marketingIdeas.length > 0 || song.marketingBudgets.length > 0;
  if (!hasMarketing) {
    return {
      label: "No tienes plan de marketing todavía",
      detail: "Genera uno automático según tu fecha — se rellena solo con ideas y presupuesto de partida.",
      tabId: "marketing",
    };
  }

  const pendingDistribution = song.distributionSteps.find((d) => d.status !== "HECHO");
  if (pendingDistribution) {
    return {
      label: "Quedan pasos con la distribuidora",
      detail: "Revisa qué falta antes del lanzamiento en la pestaña de Producción.",
      tabId: "produccion",
    };
  }

  const royaltyTotal = song.royalties.reduce((a, r) => a + r.percentage, 0);
  if (song.royalties.length === 0) {
    return {
      label: "Sin reparto de royalties definido",
      detail: "Deja anotado quién cobra qué porcentaje antes de que se te olvide.",
      tabId: "royalties",
    };
  }
  if (royaltyTotal !== 100) {
    return {
      label: `El reparto de royalties suma ${royaltyTotal}%, no 100%`,
      detail: "Ajusta los porcentajes para que cuadren.",
      tabId: "royalties",
    };
  }

  if (song.videoIdeas.length === 0 && song.references.length === 0) {
    return {
      label: "Sin ideas visuales todavía",
      detail: "Apunta una idea de vídeo o sube una imagen de referencia para la sesión de brainstorming.",
      tabId: "contenido",
    };
  }

  return {
    label: "Todo en orden por ahora",
    detail: "No hay ningún cabo suelto urgente — sigue avanzando a tu ritmo.",
    tabId: "info",
  };
}
