import Link from "next/link";
import { formatDate, formatMoney, STAGE_LABELS } from "@/lib/constants";
import { daysLabel } from "@/components/TodayPanel";
import type { DashboardData } from "./types";

/**
 * Estructura de registro: densa y tabular, como la hoja de sesión de un
 * estudio. Todo cabe de un vistazo y se lee por columnas, no por tarjetas.
 */
export default function Registro({ data }: { data: DashboardData }) {
  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-6 pb-6 border-b-2 border-white/20">
        <div>
          <div className="eyebrow mb-2">Parte de estudio</div>
          <h1 className="display-title text-5xl sm:text-6xl">Registro</h1>
        </div>
        <dl className="flex gap-8 text-right">
          <Stat n={data.totalSongs} l="canciones" />
          <Stat n={data.todo.length} l="pendientes" alert={data.todo.length > 0} />
          <Stat n={data.missingCover} l="sin portada" alert={data.missingCover > 0} />
          <Stat n={formatMoney(data.totalActual)} l={`de ${formatMoney(data.totalPlanned)}`} />
        </dl>
      </header>

      <Table
        caption="Pendiente"
        grid="2.5rem minmax(0,2.2fr) minmax(0,1.4fr) 6rem"
        cols={["", "Asunto", "Canción", "Plazo"]}
        empty="Sin cabos sueltos."
        rows={data.todo.map((item, i) => ({
          key: item.songId,
          href: `/songs/${item.songId}`,
          cells: [
            <span key="n" className="numeral text-neutral-600 tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>,
            <span key="a" className="flex items-center gap-2.5 min-w-0">
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.step.label}</span>
            </span>,
            <span key="c" className="text-neutral-500 truncate">
              {item.songTitle}
            </span>,
            <span key="p" className="numeral tabular-nums text-right block">
              {item.step.daysToRelease !== null ? daysLabel(item.step.daysToRelease) : "—"}
            </span>,
          ],
        }))}
      />

      <Table
        caption="Lanzamientos"
        grid="minmax(0,1.5fr) 9rem minmax(0,1.6fr) 6rem"
        cols={["Canción", "Fecha", "Contenido", "Faltan"]}
        empty="Ninguna fecha cercana."
        rows={data.releases.map((r) => ({
          key: r.songId,
          href: `/songs/${r.songId}`,
          cells: [
            <span key="c" className="flex items-center gap-2.5 min-w-0">
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: r.color }}
              />
              <span className="truncate">{r.songTitle}</span>
            </span>,
            <span key="f" className="text-neutral-500 tabular-nums">
              ~ {formatDate(r.releaseDate)}
            </span>,
            <span key="t" className="text-neutral-500 truncate">
              {r.tiktok.cadence}
            </span>,
            <span key="d" className="numeral tabular-nums text-right block">
              {daysLabel(r.days)}
            </span>,
          ],
        }))}
      />

      <section className="mt-10">
        <Caption>Catálogo por etapa</Caption>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-px bg-white/[0.09] border border-white/[0.09]">
          {data.byStage.map((s) => (
            <div key={s.stage} className="px-3 py-3" style={{ background: "var(--surface-1)" }}>
              <div
                className={`numeral text-2xl ${s.count > 0 ? "text-white" : "text-neutral-700"}`}
              >
                {s.count}
              </div>
              <div className="text-[0.63rem] uppercase tracking-wider text-neutral-500 mt-1 leading-tight">
                {STAGE_LABELS[s.stage]}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ n, l, alert }: { n: string | number; l: string; alert?: boolean }) {
  return (
    <div>
      <dd className={`numeral text-2xl ${alert ? "text-amber-300" : "text-white"}`}>{n}</dd>
      <dt className="text-[0.63rem] uppercase tracking-wider text-neutral-500 mt-1">{l}</dt>
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="eyebrow pb-2 mb-0 border-b border-white/[0.09]">{children}</h2>
  );
}

function Table({
  caption,
  cols,
  grid,
  rows,
  empty,
}: {
  caption: string;
  cols: string[];
  grid: string;
  empty: string;
  rows: { key: string; href: string; cells: React.ReactNode[] }[];
}) {
  return (
    <section className="mt-10">
      <Caption>{caption}</Caption>
      {rows.length === 0 ? (
        <p className="text-neutral-500 text-sm py-4">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[36rem]">
            <div
              className="grid gap-4 px-1 py-2 text-[0.63rem] uppercase tracking-wider text-neutral-600 border-b border-white/[0.09]"
              style={{ gridTemplateColumns: grid }}
            >
              {cols.map((c, i) => (
                <span key={c + i} className={i === cols.length - 1 ? "text-right" : ""}>
                  {c}
                </span>
              ))}
            </div>
            {rows.map((r) => (
              <Link
                key={r.key}
                href={r.href}
                className="grid gap-4 px-1 py-2.5 text-sm items-center border-b border-white/[0.05] hover:bg-white/[0.045] transition-colors"
                style={{ gridTemplateColumns: grid }}
              >
                {r.cells}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
