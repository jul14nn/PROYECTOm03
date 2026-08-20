import Link from "next/link";
import { formatDate, formatMoney, STAGE_LABELS } from "@/lib/constants";
import { daysLabel } from "@/components/TodayPanel";
import type { DashboardData } from "./types";

/**
 * Estructura editorial: sin cajas. La información se separa con filetes,
 * espacio y jerarquía tipográfica, como el índice de una revista.
 */
export default function Editorial({ data }: { data: DashboardData }) {
  const active = data.byStage.filter((s) => s.count > 0);

  return (
    <div className="max-w-4xl">
      <header className="pb-10">
        <div className="eyebrow mb-3">
          {new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" })
            .format(new Date())
            .toUpperCase()}
        </div>
        <h1 className="display-title text-6xl sm:text-7xl">Hoy</h1>
      </header>

      <section>
        {data.todo.length === 0 ? (
          <p className="text-lg text-neutral-400 border-t border-white/[0.09] pt-8">
            No hay nada urgente pendiente.
          </p>
        ) : (
          <ol>
            {data.todo.slice(0, 5).map((item, i) => (
              <li key={item.songId}>
                <Link
                  href={`/songs/${item.songId}`}
                  className="group grid grid-cols-[2.5rem_1fr_auto] gap-x-4 items-baseline
                             border-t border-white/[0.09] py-6 hover:border-white/25 transition-colors"
                >
                  <span className="numeral text-2xl text-neutral-700 group-hover:text-fuchsia-400 transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xl sm:text-2xl leading-snug group-hover:text-white transition-colors">
                      {item.step.label}
                    </span>
                    <span className="flex items-center gap-2 mt-1.5 text-sm text-neutral-500">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.songTitle}
                    </span>
                  </span>
                  {item.step.daysToRelease !== null && (
                    <span className="numeral text-lg text-neutral-500 tabular-nums whitespace-nowrap">
                      {daysLabel(item.step.daysToRelease)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="border-t border-white/[0.09] mt-2 pt-8 flex flex-wrap gap-x-12 gap-y-6">
        <Figure value={data.totalSongs} label="canciones" />
        <Figure value={data.brokenRoyalties} label="royalties sin cuadrar" alert={data.brokenRoyalties > 0} />
        <Figure value={data.missingCover} label="sin portada" alert={data.missingCover > 0} />
        <Figure value={formatMoney(data.totalActual)} label={`de ${formatMoney(data.totalPlanned)}`} />
      </section>

      <section className="mt-16">
        <h2 className="eyebrow mb-1">Se acerca</h2>
        {data.releases.length === 0 ? (
          <p className="text-neutral-500 text-sm border-t border-white/[0.09] pt-6 mt-5">
            Ninguna canción tiene fecha cercana.
          </p>
        ) : (
          <ul className="mt-5">
            {data.releases.slice(0, 4).map((r) => (
              <li key={r.songId}>
                <Link
                  href={`/songs/${r.songId}`}
                  className="group flex items-baseline justify-between gap-6 border-t border-white/[0.09] py-5 hover:border-white/25 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block text-lg group-hover:text-white transition-colors">
                      {r.songTitle}
                    </span>
                    <span className="text-sm text-neutral-500">{r.tiktok.cadence}</span>
                  </span>
                  <span className="text-right whitespace-nowrap">
                    <span className="numeral block text-2xl">{daysLabel(r.days)}</span>
                    <span className="text-xs text-neutral-600">~ {formatDate(r.releaseDate)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-16 border-t border-white/[0.09] pt-8">
        <h2 className="eyebrow mb-4">Reparto del catálogo</h2>
        <p className="text-lg leading-relaxed text-neutral-300">
          {active.length === 0
            ? "Aún no tienes canciones."
            : active.map((s, i) => (
                <span key={s.stage}>
                  <span className="numeral text-white">{s.count}</span>{" "}
                  <span className="text-neutral-400">en {STAGE_LABELS[s.stage].toLowerCase()}</span>
                  {i < active.length - 1 && <span className="text-neutral-700"> · </span>}
                </span>
              ))}
        </p>
      </section>
    </div>
  );
}

function Figure({
  value,
  label,
  alert,
}: {
  value: string | number;
  label: string;
  alert?: boolean;
}) {
  return (
    <div>
      <div className={`numeral text-3xl ${alert ? "text-amber-300" : "text-white"}`}>{value}</div>
      <div className="text-xs text-neutral-500 mt-1.5">{label}</div>
    </div>
  );
}
