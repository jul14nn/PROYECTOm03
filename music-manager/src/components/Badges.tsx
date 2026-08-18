import { STAGE_LABELS, TASK_STATUS_LABELS, type Stage, type TaskStatus } from "@/lib/constants";
import clsx from "clsx";

const STAGE_STYLES: Record<Stage, string> = {
  IDEA: "bg-neutral-500/15 text-neutral-300",
  PREPRODUCCION: "bg-sky-500/15 text-sky-300",
  ESCRITURA: "bg-cyan-500/15 text-cyan-300",
  GRABACION: "bg-purple-500/15 text-purple-300",
  MEZCLA: "bg-amber-500/15 text-amber-300",
  MASTER: "bg-orange-500/15 text-orange-300",
  PORTADA: "bg-pink-500/15 text-pink-300",
  DISTRIBUCION: "bg-blue-500/15 text-blue-300",
  LANZADA: "bg-emerald-500/15 text-emerald-300",
};

export function StageBadge({ stage }: { stage: string }) {
  const s = stage as Stage;
  return (
    <span className={clsx("badge", STAGE_STYLES[s] ?? "bg-neutral-500/15 text-neutral-300")}>
      {STAGE_LABELS[s] ?? stage}
    </span>
  );
}

const TASK_STYLES: Record<TaskStatus, string> = {
  PENDIENTE: "bg-neutral-500/15 text-neutral-300",
  EN_PROGRESO: "bg-amber-500/15 text-amber-300",
  HECHO: "bg-emerald-500/15 text-emerald-300",
};

export function TaskStatusBadge({ status }: { status: string }) {
  const s = status as TaskStatus;
  return (
    <span className={clsx("badge", TASK_STYLES[s] ?? "bg-neutral-500/15 text-neutral-300")}>
      {TASK_STATUS_LABELS[s] ?? status}
    </span>
  );
}

export function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-3 w-3 rounded-full ring-1 ring-white/20"
      style={{ backgroundColor: color }}
    />
  );
}
