import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/constants";
import { daysUntil } from "@/lib/tiktokPlan";
import {
  PHASES,
  CONTENT_ASSETS,
  AD_PLAYBOOK,
  currentPhase,
  LAUNCH_STEPS,
} from "@/lib/launchPlan";
import { ColorDot } from "@/components/Badges";
import Arreglo from "@/components/Arreglo";
import { buildCampaigns } from "@/lib/campaignSpan";
import { ArrowRight } from "lucide-react";

export default async function MarketingPage() {
  const userId = await requireUserId();
  const songs = await prisma.song.findMany({
    where: { userId },
    include: { launchTasks: true, marketingBudgets: true },
    orderBy: { releaseDate: "asc" },
  });

  // Campañas vivas: las que tienen plan y aún no han cerrado el ciclo.
  const campaigns = songs
    .filter((s) => s.launchTasks.length > 0)
    .map((s) => {
      const days = s.releaseDate ? daysUntil(s.releaseDate) : null;
      const done = s.launchTasks.filter((t) => t.status === "HECHO").length;
      const phase = currentPhase(days);
      const overdue = s.launchTasks.filter(
        (t) => t.status !== "HECHO" && t.dueDate && daysUntil(t.dueDate) < 0
      ).length;
      const next = s.launchTasks
        .filter((t) => t.status !== "HECHO")
        .sort((a, b) => a.dayOffset - b.dayOffset)[0];
      return { song: s, days, done, total: s.launchTasks.length, phase, overdue, next };
    })
    .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));

  const sinPlan = songs.filter((s) => s.launchTasks.length === 0);
  const totalPlanned = songs
    .flatMap((s) => s.marketingBudgets)
    .reduce((a, b) => a + b.plannedAmount, 0);
  const totalActual = songs
    .flatMap((s) => s.marketingBudgets)
    .reduce((a, b) => a + b.actualAmount, 0);
  const adCost = LAUNCH_STEPS.reduce((a, s) => a + (s.cost ?? 0), 0);
  const arrangement = buildCampaigns(songs);

  return (
    <div className="max-w-4xl">
      <header className="pb-10">
        <div className="eyebrow mb-3">Promoción</div>
        <h1 className="display-title text-5xl sm:text-6xl">Marketing</h1>
        <p className="text-neutral-400 text-sm mt-4 max-w-lg">
          Acompañamiento de principio a fin: {LAUNCH_STEPS.length} pasos repartidos en{" "}
          {PHASES.length} fases, desde aprobar el máster hasta el balance del mes
          siguiente.
        </p>
      </header>

      {/* ----------------------------------------------------- Campañas vivas */}
      <section className="mb-16">
        <h2 className="eyebrow pb-3 border-b border-white/20">Campañas en marcha</h2>
        {campaigns.length === 0 ? (
          <div className="py-6">
            <p className="text-neutral-400 text-sm max-w-md">
              Ninguna canción tiene plan todavía. El plan se crea desde la canción,
              porque las fechas de cada paso salen de su fecha de lanzamiento.
            </p>
            <Link href="/songs" className="btn btn-secondary mt-4">
              Elegir una canción
            </Link>
          </div>
        ) : (
          <ul>
            {campaigns.map((c) => {
              const pct = Math.round((c.done / c.total) * 100);
              return (
                <li key={c.song.id}>
                  <Link
                    href={`/songs/${c.song.id}`}
                    className="group block border-b border-white/[0.07] py-6 hover:border-white/25 transition-colors"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="flex items-baseline gap-2.5 min-w-0">
                        <ColorDot color={c.song.color} />
                        <span className="text-xl sm:text-2xl truncate group-hover:text-white transition-colors">
                          {c.song.title}
                        </span>
                      </span>
                      <span className="text-right whitespace-nowrap">
                        <span className="numeral block text-xl leading-none text-neutral-300">
                          {c.days === null ? "—" : c.days <= 0 ? "fuera" : c.days}
                        </span>
                        {c.days !== null && c.days > 0 && (
                          <span className="text-[0.6rem] uppercase tracking-wider text-neutral-600">
                            {c.days === 1 ? "día" : "días"}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs">
                      {c.phase && (
                        <span className="text-fuchsia-300">
                          {PHASES.find((p) => p.id === c.phase)?.name}
                        </span>
                      )}
                      <span className="text-neutral-500">
                        {c.done}/{c.total} pasos · {pct}%
                      </span>
                      {c.overdue > 0 && (
                        <span className="text-amber-300">
                          {c.overdue} fuera de plazo
                        </span>
                      )}
                    </div>

                    <div className="meter mt-3 max-w-sm">
                      <div className="meter-fill" style={{ width: `${pct}%` }} />
                    </div>

                    {c.next && (
                      <p className="text-sm text-neutral-400 mt-3 flex items-start gap-2">
                        <ArrowRight size={14} className="mt-1 shrink-0 text-neutral-600" />
                        <span>
                          <span className="text-neutral-200">{c.next.title}</span>
                          {c.next.dueDate && (
                            <span className="text-neutral-600"> · {formatDate(c.next.dueDate)}</span>
                          )}
                        </span>
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {sinPlan.length > 0 && (
          <p className="text-xs text-neutral-600 mt-5">
            Sin plan todavía:{" "}
            {sinPlan.map((s, i) => (
              <span key={s.id}>
                <Link href={`/songs/${s.id}`} className="text-fuchsia-400 hover:underline">
                  {s.title}
                </Link>
                {i < sinPlan.length - 1 && ", "}
              </span>
            ))}
          </p>
        )}
      </section>

      {/* ------------------------------------------------------- Calendario */}
      <section className="mb-16">
        <h2 className="eyebrow pb-3 border-b border-white/20 mb-6">
          Calendario de campañas
        </h2>
        <Arreglo campaigns={arrangement} />
      </section>

      {/* ------------------------------------------------------------- Fases */}
      <section className="mb-16">
        <h2 className="eyebrow pb-3 border-b border-white/20">Cómo funciona una campaña</h2>
        <ol className="mt-2">
          {PHASES.map((p, i) => (
            <li
              key={p.id}
              className="grid grid-cols-[2rem_1fr] gap-x-4 items-baseline border-b border-white/[0.07] py-5"
            >
              <span className="numeral text-xl text-neutral-700">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-lg">{p.name}</span>
                  <span className="text-xs text-neutral-600">{p.window}</span>
                </span>
                <span className="block text-sm text-neutral-500 mt-1">{p.goal}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ----------------------------------------------------------- Anuncios */}
      <section className="mb-16">
        <h2 className="eyebrow pb-3 border-b border-white/20">Anuncios de pago</h2>
        <p className="text-sm text-neutral-500 mt-4 mb-2 max-w-xl">
          Presupuesto de referencia para toda la campaña:{" "}
          <span className="numeral text-base text-neutral-200">{formatMoney(adCost)}</span>. No
          hace falta más para un primer lanzamiento.
        </p>
        <div className="space-y-0">
          {AD_PLAYBOOK.map((a) => (
            <div key={a.phase} className="border-b border-white/[0.07] py-5">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-lg">{a.phase}</span>
                <span className="badge bg-white/[0.06] text-neutral-300">{a.objective}</span>
                <span className="text-sm text-neutral-400">{a.budget}</span>
              </div>
              <dl className="mt-2.5 text-sm space-y-1.5 max-w-2xl">
                <div className="flex gap-3">
                  <dt className="text-neutral-600 w-24 shrink-0">Público</dt>
                  <dd className="text-neutral-400">{a.audience}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="text-neutral-600 w-24 shrink-0">Destino</dt>
                  <dd className="text-neutral-400">{a.destination}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="text-amber-300/70 w-24 shrink-0">Cuidado</dt>
                  <dd className="text-neutral-400">{a.warning}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Activos */}
      <section className="mb-16">
        <h2 className="eyebrow pb-3 border-b border-white/20">Activos que vas a necesitar</h2>
        <ul className="mt-2">
          {CONTENT_ASSETS.map((a) => (
            <li key={a.name} className="border-b border-white/[0.07] py-4">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-neutral-100">{a.name}</span>
                <span className="text-xs text-neutral-500 tabular-nums">{a.spec}</span>
              </div>
              <p className="text-sm text-neutral-500 mt-1">{a.why}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* --------------------------------------------------------- Presupuesto */}
      <section className="border-t border-white/20 pt-8 flex flex-wrap gap-x-12 gap-y-6">
        <div>
          <div className="numeral text-3xl text-white">{formatMoney(totalActual)}</div>
          <div className="text-xs text-neutral-500 mt-1.5">
            gastado de {formatMoney(totalPlanned)} planificado
          </div>
        </div>
        <div>
          <div className="numeral text-3xl text-white">{campaigns.length}</div>
          <div className="text-xs text-neutral-500 mt-1.5">campañas en marcha</div>
        </div>
      </section>
    </div>
  );
}
