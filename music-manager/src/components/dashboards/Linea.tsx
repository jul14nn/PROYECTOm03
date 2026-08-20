import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/constants";
import { daysUntil } from "@/lib/tiktokPlan";
import type { DashboardData } from "./types";

type Entry = {
  key: string;
  days: number | null;
  href: string;
  kind: "paso" | "lanzamiento" | "evento";
  title: string;
  sub: string;
  color?: string;
};

const KIND_LABEL: Record<Entry["kind"], string> = {
  paso: "Pendiente",
  lanzamiento: "Lanzamiento",
  evento: "Agenda",
};

/**
 * Estructura de línea de tiempo: el eje no son las categorías sino CUÁNDO.
 * Pasos pendientes, lanzamientos y eventos se mezclan en un único hilo
 * ordenado por fecha, que es como piensa alguien que prepara un lanzamiento.
 */
export default function Linea({ data }: { data: DashboardData }) {
  const entries: Entry[] = [
    ...data.releases.map((r) => ({
      key: "r" + r.songId,
      days: r.days,
      href: `/songs/${r.songId}`,
      kind: "lanzamiento" as const,
      title: r.songTitle,
      sub: `Sale ~ ${formatDate(r.releaseDate)} · ${r.tiktok.cadence}`,
      color: r.color,
    })),
    ...data.events.map((e) => ({
      key: "e" + e.id,
      days: daysUntil(e.startDate),
      href: `/calendar/${e.id}`,
      kind: "evento" as const,
      title: e.title,
      sub: formatDateTime(e.startDate) + (e.songTitle ? ` · ${e.songTitle}` : ""),
    })),
    ...data.todo.map((t) => ({
      key: "t" + t.songId,
      days: t.step.daysToRelease,
      href: `/songs/${t.songId}`,
      kind: "paso" as const,
      title: t.step.label,
      sub: t.songTitle,
      color: t.color,
    })),
  ].sort((a, b) => {
    // Lo que no tiene fecha se va al final: no compite con lo que corre.
    if (a.days === null) return 1;
    if (b.days === null) return -1;
    return a.days - b.days;
  });

  return (
    <div className="max-w-3xl">
      <header className="pb-10">
        <div className="eyebrow mb-3">Lo que viene</div>
        <h1 className="display-title text-6xl sm:text-7xl">Línea</h1>
        <p className="text-neutral-400 text-sm mt-4 max-w-md">
          Pendientes, lanzamientos y agenda en un solo hilo, ordenados por
          cuándo tocan.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="text-neutral-500">Nada en el horizonte.</p>
      ) : (
        <ol className="relative">
          {/* El hilo vertical es el eje de tiempo. */}
          <span
            aria-hidden
            className="absolute left-[4.7rem] top-2 bottom-2 w-px"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--accent-magenta) 60%, transparent), transparent)",
            }}
          />
          {entries.map((e) => (
            <li key={e.key} className="relative">
              <Link
                href={e.href}
                className="group grid grid-cols-[4.2rem_1.5rem_1fr] gap-x-3 items-start py-4 hover:bg-white/[0.03] rounded-lg -mx-2 px-2 transition-colors"
              >
                <span className="text-right pt-0.5">
                  <span className="numeral block text-lg leading-none text-neutral-300">
                    {e.days === null ? "—" : e.days <= 0 ? "hoy" : e.days}
                  </span>
                  {e.days !== null && e.days > 0 && (
                    <span className="text-[0.6rem] uppercase tracking-wider text-neutral-600">
                      {e.days === 1 ? "día" : "días"}
                    </span>
                  )}
                </span>

                <span className="flex justify-center pt-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full ring-4 shrink-0"
                    style={{
                      backgroundColor: e.color ?? "var(--accent-violet)",
                      // El anillo del color del fondo abre un hueco en el hilo.
                      boxShadow: "0 0 0 4px var(--background)",
                    }}
                  />
                </span>

                <span className="min-w-0 pb-1">
                  <span className="text-[0.6rem] uppercase tracking-wider text-neutral-600">
                    {KIND_LABEL[e.kind]}
                  </span>
                  <span className="block text-lg leading-snug mt-0.5 group-hover:text-white transition-colors">
                    {e.title}
                  </span>
                  <span className="block text-sm text-neutral-500 mt-0.5">{e.sub}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-14 pt-6 border-t border-white/[0.09] flex flex-wrap gap-x-10 gap-y-4 text-sm">
        <span>
          <span className="numeral text-xl text-white">{data.totalSongs}</span>{" "}
          <span className="text-neutral-500">canciones</span>
        </span>
        <span>
          <span
            className={`numeral text-xl ${data.missingCover > 0 ? "text-amber-300" : "text-white"}`}
          >
            {data.missingCover}
          </span>{" "}
          <span className="text-neutral-500">sin portada</span>
        </span>
        <span>
          <span
            className={`numeral text-xl ${data.brokenRoyalties > 0 ? "text-amber-300" : "text-white"}`}
          >
            {data.brokenRoyalties}
          </span>{" "}
          <span className="text-neutral-500">royalties sin cuadrar</span>
        </span>
      </div>
    </div>
  );
}
