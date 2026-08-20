export const STAGES = [
  "IDEA",
  "PREPRODUCCION",
  "ESCRITURA",
  "GRABACION",
  "MEZCLA",
  "MASTER",
  "PORTADA",
  "DISTRIBUCION",
  "LANZADA",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  IDEA: "Idea",
  PREPRODUCCION: "Pre-producción",
  ESCRITURA: "Escritura",
  GRABACION: "Grabación",
  MEZCLA: "Mezcla",
  MASTER: "Máster",
  PORTADA: "Portada",
  DISTRIBUCION: "Distribución",
  LANZADA: "Lanzada",
};

export const TASK_STATUSES = ["PENDIENTE", "EN_PROGRESO", "HECHO"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  HECHO: "Hecho",
};

export const NEXT_TASK_STATUS: Record<TaskStatus, TaskStatus> = {
  PENDIENTE: "EN_PROGRESO",
  EN_PROGRESO: "HECHO",
  HECHO: "PENDIENTE",
};

export const SUGGESTED_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#ef4444", // red
  "#8b5cf6", // violet
  "#14b8a6", // teal
];

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(date);
}

export function formatDateApprox(d: Date | string | null | undefined) {
  if (!d) return "—";
  return `~ ${formatDate(d)}`;
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatDateInput(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function formatDateTimeInput(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function formatMoney(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(amount);
}
