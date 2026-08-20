import Link from "next/link";
import { formatDate, formatDateTime, formatMoney } from "@/lib/constants";
import { daysUntil } from "@/lib/tiktokPlan";
import { Plus } from "lucide-react";
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
 * Tramos en vez de una cuenta de días por fila: si tres cosas caen el mismo
 * día, repetir "5 días" tres veces es ruido. El tramo lo dice una vez.
 */
const BUCKETS: { id: string; label: string; max: number }[] = [
  { id: "ya", label: "Hoy y mañana", max: 1 },
  { id: "semana", label: "Esta semana", max: 7 },
  { id: "quincena", label: "En dos semanas", max: 14 },
  { id: "mes", label: "Este mes", max: 31 },
  { id: "despues", label: "Más adelante", max: Infinity },
];

function bucketOf(days: number | null) {
  if (days === null) return "sinfecha";
  return BUCKETS.find((b) => days <= b.max)!.id;
}

/**
 * Panel definitivo: el orden lo marca CUÁNDO (como el prototipo "Línea") y la
 * maquetación es editorial — sin recuadros, solo filetes, espacio y jerarquía
 * tipográfica. Pendientes, lanzamientos y agenda viven en un mismo hilo.
 */
export default function Hilo({ data }: { data: DashboardData }) {
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
    if (a.days === null) return 1;
    if (b.days === null) return -1;
    return a.days - b.days;
  });

  const groups = [...BUCKETS.map((b) => b.id), "sinfecha"]
    .map((id) => ({
      id,
      label: id === "sinfecha" ? "Sin fecha" : BUCKETS.find((b) => b.id === id)!.label,
      items: entries.filter((e) => bucketOf(e.days) === id),
    }))
    .filter((g) => g.items.length > 0);

  const today = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  // Primera vez: sin ninguna canción no hay hilo que enseñar, y un panel a
  // ceros sin nada que pulsar deja al recién llegado en un callejón sin salida.
  if (data.totalSongs === 0) {
    return (
      <div className="max-w-2xl">
        <header className="pb-8">
          <div className="eyebrow mb-3">Empecemos</div>
          <h1 className="display-title text-6xl sm:text-7xl">Tu primera canción</h1>
          <p className="text-neutral-400 mt-5 text-lg leading-relaxed">
            Esta pantalla se convierte en tu hilo del día: pendientes,
            lanzamientos y agenda ordenados por lo que toca antes. Para que
            tenga algo que contarte, empieza por dar de alta una canción.
          </p>
        </header>

        <Link href="/songs/new" className="btn btn-primary">
          <Plus size={16} /> Crear mi primera canción
        </Link>

        <ol className="mt-14">
          {[
            {
              t: "Dale una fecha aproximada",
              d: "No hace falta que sea firme. Desbloquea el plan de contenido y los avisos.",
            },
            {
              t: "Genera su plan de lanzamiento",
              d: "31 pasos con fecha, desde aprobar el máster hasta el balance del mes siguiente.",
            },
            {
              t: "Vuelve aquí cada mañana",
              d: "Te dirá qué toca hoy sin que tengas que revisar canción por canción.",
            },
          ].map((step, i) => (
            <li
              key={step.t}
              className="grid grid-cols-[2.5rem_1fr] gap-x-4 items-baseline border-t border-white/[0.09] py-5"
            >
              <span className="numeral text-2xl text-neutral-700">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block text-lg">{step.t}</span>
                <span className="block text-sm text-neutral-500 mt-1">{step.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <header className="pb-12">
        <div className="eyebrow mb-3">{today.toUpperCase()}</div>
        <h1 className="display-title text-6xl sm:text-7xl">Hoy</h1>
      </header>

      {groups.length === 0 ? (
        <div className="border-t border-white/[0.09] pt-8">
          <p className="text-lg text-neutral-400">
            Nada en el horizonte. Buen momento para escribir algo nuevo.
          </p>
          <Link href="/songs/new" className="btn btn-secondary mt-5">
            <Plus size={15} /> Nueva canción
          </Link>
        </div>
      ) : (
        <div className="stagger">
        {groups.map((g) => (
          <section key={g.id} className="mb-14">
            <h2 className="eyebrow pb-3 border-b border-white/20">{g.label}</h2>
            <ul>
              {g.items.map((e) => (
                <li key={e.key}>
                  <Link
                    href={e.href}
                    className="group grid grid-cols-[auto_1fr_auto] gap-x-4 sm:gap-x-6 items-baseline
                               border-b border-white/[0.07] py-5 hover:border-white/25 transition-colors"
                  >
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full self-center shrink-0"
                      style={{ backgroundColor: e.color ?? "var(--accent-violet)" }}
                    />
                    <span className="min-w-0">
                      <span className="text-[0.6rem] uppercase tracking-[0.15em] text-neutral-600">
                        {KIND_LABEL[e.kind]}
                      </span>
                      <span className="block text-xl sm:text-2xl leading-snug mt-0.5 group-hover:text-white transition-colors">
                        {e.title}
                      </span>
                      <span className="block text-sm text-neutral-500 mt-1">{e.sub}</span>
                    </span>
                    <span className="text-right whitespace-nowrap">
                      <span className="numeral block text-xl leading-none text-neutral-400">
                        {e.days === null ? "—" : e.days <= 0 ? "hoy" : e.days}
                      </span>
                      {e.days !== null && e.days > 0 && (
                        <span className="text-[0.6rem] uppercase tracking-wider text-neutral-600">
                          {e.days === 1 ? "día" : "días"}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        </div>
      )}

      <section className="border-t border-white/20 pt-8 flex flex-wrap gap-x-12 gap-y-6">
        <Figure value={data.totalSongs} label="canciones" />
        <Figure
          value={data.missingCover}
          label="sin portada"
          alert={data.missingCover > 0}
        />
        <Figure
          value={data.brokenRoyalties}
          label="royalties sin cuadrar"
          alert={data.brokenRoyalties > 0}
        />
        <Figure
          value={formatMoney(data.totalActual)}
          label={`de ${formatMoney(data.totalPlanned)} en marketing`}
        />
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
