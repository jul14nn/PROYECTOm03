import Vu from "@/components/Vu";
import { PHASES, type PhaseId, currentPhase } from "@/lib/launchPlan";
import { cycleLaunchTask } from "@/lib/actions/launch";
import { formatDate, formatMoney } from "@/lib/constants";
import { Check, Circle, Clock } from "lucide-react";

export type PlanTask = {
  id: string;
  title: string;
  detail: string | null;
  phase: string;
  channel: string | null;
  dayOffset: number;
  dueDate: Date | null;
  cost: number | null;
  status: string;
};

function offsetLabel(day: number) {
  if (day === 0) return "El día";
  if (day < 0) return `${-day} d antes`;
  return `${day} d después`;
}

/**
 * El plan completo de una canción, agrupado por fases. Solo la fase actual
 * viene desplegada: son 30 pasos y verlos todos de golpe abruma, que es
 * justo lo que queríamos evitar.
 */
export default function LaunchPlan({
  songId,
  tasks,
  daysToRelease,
}: {
  songId: string;
  tasks: PlanTask[];
  daysToRelease: number | null;
}) {
  const active = currentPhase(daysToRelease);
  const done = tasks.filter((t) => t.status === "HECHO").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-3 border-b border-white/20">
        <h3 className="eyebrow">Plan de lanzamiento</h3>
        <span className="text-sm text-neutral-400">
          <span className="numeral text-lg text-white">{done}</span>
          <span className="text-neutral-600"> / {tasks.length}</span> pasos · {pct}%
        </span>
      </div>
      {/* Hereda --song de la ficha: el VU se enciende en el color de la canción. */}
      <Vu value={pct / 100} segments={31} className="mt-3" label="Progreso del plan" />

      <div className="mt-8 space-y-3">
        {PHASES.map((phase) => {
          const items = tasks
            .filter((t) => t.phase === phase.id)
            .sort((a, b) => a.dayOffset - b.dayOffset);
          if (items.length === 0) return null;

          const phaseDone = items.filter((t) => t.status === "HECHO").length;
          const isActive = active === phase.id;

          return (
            <details key={phase.id} open={isActive} className="group">
              <summary
                className="flex items-baseline gap-3 cursor-pointer py-3 border-b border-white/[0.09]
                           hover:border-white/25 transition-colors list-none"
              >
                <span
                  className="text-[0.6rem] uppercase tracking-[0.15em] shrink-0 w-4"
                  style={{ color: isActive ? "var(--accent-magenta)" : "#5a5665" }}
                >
                  {phaseDone === items.length ? "✓" : "›"}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-lg">{phase.name}</span>
                    {isActive && (
                      <span
                        className="badge"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--accent-violet), var(--accent-magenta))",
                          color: "white",
                        }}
                      >
                        Estás aquí
                      </span>
                    )}
                    <span className="text-xs text-neutral-600">{phase.window}</span>
                  </span>
                  <span className="block text-sm text-neutral-500 mt-0.5">{phase.goal}</span>
                </span>
                <span className="numeral text-sm text-neutral-500 shrink-0">
                  {phaseDone}/{items.length}
                </span>
              </summary>

              <ul className="pl-7 pb-4">
                {items.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-start gap-3 py-4 border-b border-white/[0.05] last:border-0"
                  >
                    <form action={cycleLaunchTask.bind(null, songId, t.id, t.status)}>
                      <button
                        type="submit"
                        aria-label={`Cambiar estado de ${t.title}`}
                        className="mt-0.5 shrink-0 transition-colors"
                        style={{
                          color:
                            t.status === "HECHO"
                              ? "#34d399"
                              : t.status === "EN_PROGRESO"
                                ? "#fbbf24"
                                : "#5a5665",
                        }}
                      >
                        {t.status === "HECHO" ? (
                          <Check size={17} />
                        ) : t.status === "EN_PROGRESO" ? (
                          <Clock size={17} />
                        ) : (
                          <Circle size={17} />
                        )}
                      </button>
                    </form>

                    <div className="flex-1 min-w-0">
                      <div
                        className={
                          t.status === "HECHO"
                            ? "line-through text-neutral-600"
                            : "text-neutral-100"
                        }
                      >
                        {t.title}
                      </div>
                      {t.detail && (
                        <p className="text-sm text-neutral-500 mt-1 leading-relaxed max-w-2xl">
                          {t.detail}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[0.68rem] text-neutral-600">
                        {t.channel && <span className="text-neutral-500">{t.channel}</span>}
                        <span>{offsetLabel(t.dayOffset)}</span>
                        {t.dueDate && <span>· {formatDate(t.dueDate)}</span>}
                        {t.cost != null && (
                          <span className="text-amber-300/70">· ~{formatMoney(t.cost)}</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}

export function phaseName(id: string) {
  return PHASES.find((p) => p.id === (id as PhaseId))?.name ?? id;
}
