import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { STAGES, STAGE_LABELS, formatDateTime, formatMoney } from "@/lib/constants";
import { buildTodayList, upcomingReleases, songsWithBrokenRoyalties } from "@/lib/agenda";
import TipOfTheDay from "@/components/TipOfTheDay";
import { TodayPanel, ReleaseCountdown } from "@/components/TodayPanel";
import { ArrowRight, CalendarClock } from "lucide-react";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [songs, upcomingEvents, budgets] = await Promise.all([
    prisma.song.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        tasks: true,
        distributionSteps: true,
        marketingIdeas: true,
        marketingBudgets: true,
        royalties: true,
        videoIdeas: true,
        references: true,
      },
    }),
    prisma.calendarEvent.findMany({
      where: { userId, startDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 5,
      include: { song: true },
    }),
    prisma.marketingBudgetItem.findMany({ where: { song: { userId } } }),
  ]);

  const byStage = STAGES.map((s) => ({
    stage: s,
    count: songs.filter((song) => song.stage === s).length,
  }));

  const todo = buildTodayList(songs);
  const releases = upcomingReleases(songs);
  const brokenRoyalties = songsWithBrokenRoyalties(songs);
  const totalPlanned = budgets.reduce((a, b) => a + b.plannedAmount, 0);
  const totalActual = budgets.reduce((a, b) => a + b.actualAmount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Lo que toca hacer hoy, tu pipeline y lo que se acerca.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <TodayPanel items={todo} />
        <ReleaseCountdown releases={releases} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Canciones activas" value={songs.length} />
        <StatCard
          label="Royalties sin cuadrar"
          value={brokenRoyalties}
          sub={brokenRoyalties === 0 ? "todo suma 100%" : "no suman 100%"}
          accent={brokenRoyalties > 0 ? "text-amber-300" : undefined}
        />
        <StatCard
          label="Sin portada"
          value={songs.filter((s) => s.needsCover).length}
          accent="text-pink-300"
        />
        <StatCard
          label="Presupuesto marketing"
          value={formatMoney(totalActual)}
          sub={`de ${formatMoney(totalPlanned)} planificado`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Pipeline de canciones</h2>
          <div className="space-y-2">
            {byStage.map(({ stage, count }) => (
              <div key={stage} className="flex items-center gap-3">
                <div className="w-32 text-sm text-neutral-400">{STAGE_LABELS[stage]}</div>
                <div className="flex-1 h-2 rounded-full bg-neutral-900 overflow-hidden">
                  <div
                    className="h-full bg-fuchsia-500"
                    style={{
                      width: songs.length ? `${(count / songs.length) * 100}%` : "0%",
                    }}
                  />
                </div>
                <div className="w-6 text-right text-sm">{count}</div>
              </div>
            ))}
          </div>
          {songs.length === 0 && (
            <p className="text-neutral-500 text-sm mt-4">
              Aún no tienes canciones.{" "}
              <Link href="/songs/new" className="text-fuchsia-400 hover:underline">
                Crea la primera
              </Link>
              .
            </p>
          )}
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Próximos eventos</h2>
            <Link href="/calendar" className="text-xs text-fuchsia-400 hover:underline flex items-center gap-1">
              Ver agenda <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map((ev) => (
              <Link
                key={ev.id}
                href={`/calendar/${ev.id}`}
                className="flex items-start gap-3 text-sm hover:bg-neutral-900 rounded-lg p-2 -mx-2"
              >
                <CalendarClock size={16} className="text-fuchsia-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">{ev.title}</div>
                  <div className="text-neutral-500 text-xs">{formatDateTime(ev.startDate)}</div>
                  {ev.song && <div className="text-neutral-600 text-xs">{ev.song.title}</div>}
                </div>
              </Link>
            ))}
            {upcomingEvents.length === 0 && (
              <p className="text-neutral-500 text-sm">No hay eventos próximos.</p>
            )}
          </div>
        </section>
      </div>

      <TipOfTheDay />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${accent ?? ""}`}>{value}</div>
      {sub && <div className="text-xs text-neutral-600 mt-1">{sub}</div>}
    </div>
  );
}
