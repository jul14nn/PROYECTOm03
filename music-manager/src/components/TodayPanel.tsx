import Link from "next/link";
import clsx from "clsx";
import { ColorDot } from "@/components/Badges";
import { formatDate } from "@/lib/constants";
import type { AgendaItem, UpcomingRelease } from "@/lib/agenda";
import { ArrowRight, CheckCircle2, Rocket, Music4 } from "lucide-react";

export function daysLabel(days: number) {
  if (days < 0) return `Hace ${-days} d`;
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `${days} días`;
}

function daysTone(days: number | null) {
  if (days === null) return "bg-neutral-800 text-neutral-400";
  if (days < 0 || days <= 3) return "bg-red-500/15 text-red-300";
  if (days <= 14) return "bg-amber-500/15 text-amber-300";
  return "bg-neutral-800 text-neutral-400";
}

/**
 * Lista única y priorizada de lo que toca hacer en todo el catálogo.
 * Sustituye a las tarjetas sueltas de "portadas pendientes" y "distribución
 * pendiente", que decían lo mismo por separado y sin orden de urgencia.
 */
export function TodayPanel({ items }: { items: AgendaItem[] }) {
  const shown = items.slice(0, 5);
  const rest = items.length - shown.length;

  return (
    // min-w-0: sin esto el hijo de grid usa min-width:auto y el título en
    // Anton estira la tarjeta más allá del ancho de la pantalla en móvil.
    <section className="card card-featured p-6 lg:col-span-2 min-w-0">
      <div className="flex items-baseline justify-between gap-3 mb-5">
        <h2 className="display text-2xl min-w-0">Qué hago hoy</h2>
        {items.length > 0 && (
          <span className="eyebrow text-[0.6rem] shrink-0 text-right leading-tight">
            {items.length}{" "}
            <span className="hidden sm:inline">
              {items.length === 1 ? "cabo suelto" : "cabos sueltos"}
            </span>
            <span className="sm:hidden">pend.</span>
          </span>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="flex items-center gap-3 text-sm text-neutral-400 py-4">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <span>
            No hay nada urgente pendiente. Buen momento para escribir algo nuevo.
          </span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {shown.map((item) => (
            <Link
              key={item.songId}
              href={`/songs/${item.songId}`}
              className="flex items-center gap-3.5 row-hover p-3 -mx-1 group"
            >
              <ColorDot color={item.color} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.step.label}</div>
                <div className="text-xs text-neutral-500 truncate mt-0.5">{item.songTitle}</div>
              </div>
              {item.step.daysToRelease !== null && (
                <span
                  className={clsx("badge shrink-0", daysTone(item.step.daysToRelease))}
                >
                  {daysLabel(item.step.daysToRelease)}
                </span>
              )}
              <ArrowRight
                size={15}
                className="text-neutral-600 group-hover:text-fuchsia-400 shrink-0 transition-colors"
              />
            </Link>
          ))}
          {rest > 0 && (
            <Link
              href="/songs"
              className="block text-xs text-fuchsia-400 hover:underline pt-2 pl-1"
            >
              y {rest} {rest === 1 ? "canción más" : "canciones más"} con algo pendiente
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Cuenta atrás de lanzamientos: lo más sensible al tiempo de todo el catálogo,
 * junto con las sesiones de TikTok que tocan esta semana.
 */
export function ReleaseCountdown({ releases }: { releases: UpcomingRelease[] }) {
  const shown = releases.slice(0, 3);

  return (
    <section className="card p-6 min-w-0">
      <div className="flex items-center gap-2 mb-5">
        <Rocket size={14} className="text-fuchsia-400 shrink-0" />
        <h2 className="eyebrow">Próximos lanzamientos</h2>
      </div>

      {shown.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          Ninguna canción tiene fecha cercana. Pon una fecha aproximada para
          activar el plan de contenido.
        </p>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <Link
              key={r.songId}
              href={`/songs/${r.songId}`}
              className="block row-hover p-3 -mx-1"
            >
              <div className="flex items-center gap-2">
                <ColorDot color={r.color} />
                <span className="text-sm font-medium flex-1 truncate">{r.songTitle}</span>
                <span className={clsx("badge shrink-0", daysTone(r.days))}>
                  {daysLabel(r.days)}
                </span>
              </div>
              <div className="text-xs text-neutral-600 mt-1 ml-5">
                ~ {formatDate(r.releaseDate)}
              </div>
              <div className="text-xs text-neutral-400 mt-1.5 ml-5 flex items-start gap-1.5">
                <Music4 size={12} className="text-fuchsia-400 mt-0.5 shrink-0" />
                <span>{r.tiktok.cadence}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
