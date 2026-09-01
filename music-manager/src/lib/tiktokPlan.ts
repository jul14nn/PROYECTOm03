export const REMINDER_THRESHOLDS = [30, 14, 7, 3, 1] as const;
export type ReminderThreshold = (typeof REMINDER_THRESHOLDS)[number];

export function daysUntil(date: Date, from: Date = new Date()) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b - a) / 86_400_000);
}

export type TiktokPlan = {
  sessions: number;
  cadence: string;
  focus: string;
};

/**
 * Recomendación de sesiones de TikTok según lo cerca que esté la fecha
 * aproximada de lanzamiento. Cuanto más cerca, más frecuencia y más foco
 * en cuenta atrás / adelantos concretos en vez de teaser genérico.
 */
export function tiktokPlanFor(days: number): TiktokPlan {
  if (days >= 25) {
    return {
      sessions: 2,
      cadence: "2 sesiones esta semana",
      focus: "Teaser de ambiente: estudio, proceso, referencias visuales — sin enseñar el gancho todavía.",
    };
  }
  if (days >= 10) {
    return {
      sessions: 4,
      cadence: "4 sesiones esta semana",
      focus: "Empieza a enseñar fragmentos del hook y detrás de cámaras de la grabación.",
    };
  }
  if (days >= 4) {
    return {
      sessions: 6,
      cadence: "6 sesiones esta semana",
      focus: "Cuenta atrás visible, adelantos del estribillo, colabora con el featuring si lo hay.",
    };
  }
  if (days >= 1) {
    return {
      sessions: 1,
      cadence: "1 sesión diaria hasta el lanzamiento",
      focus: "Cuenta atrás final ('quedan X días'), enlace a preguardar, recordatorio constante.",
    };
  }
  return {
    sessions: 3,
    cadence: "3 sesiones el día del lanzamiento",
    focus: "Anuncio de que ya está fuera, reacciones en directo, pineable con el enlace de streaming.",
  };
}
