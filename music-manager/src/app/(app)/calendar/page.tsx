import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ColorDot } from "@/components/Badges";
import { MapPin, Plus, Mail, Megaphone, ChevronDown } from "lucide-react";

/**
 * La agenda junta eventos con hora y pasos de lanzamiento con fecha, y los
 * presenta con ritmo: agrupados por día, lo de hoy grande, lo lejano más
 * tenue. Una agenda real tiene días cargados y días vacíos — la lista
 * uniforme de antes pintaba todo con la misma intensidad.
 */

type AgendaItem = {
  key: string;
  kind: "evento" | "lanzamiento";
  date: Date;
  href: string;
  title: string;
  song: { title: string; color: string } | null;
  location?: string | null;
  invitesSent?: string | null;
  hasTime: boolean;
};

const HOUR_FMT = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });
const DAY_FMT = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "short" });
const DATETIME_FMT = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(d: Date, now: Date) {
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(d) - startOf(now)) / 86400000);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  return DAY_FMT.format(d);
}

/** Lo cercano a plena luz; lo lejano se aleja también visualmente. */
function distanceClass(d: Date, now: Date) {
  const days = (d.getTime() - now.getTime()) / 86400000;
  if (days <= 7) return "";
  if (days <= 14) return "opacity-85";
  return "opacity-65";
}

export default async function CalendarPage() {
  const userId = await requireUserId();
  const now = new Date();
  const [events, launchTasks] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startDate: "asc" },
      include: { song: true, invites: true },
    }),
    prisma.launchTask.findMany({
      where: {
        song: { userId },
        status: { not: "HECHO" },
        // Solo el horizonte cercano: un plan entero son 31 pasos por canción
        // y volcados de golpe ahogan las citas reales entre pasos de octubre.
        dueDate: { not: null, gte: now, lte: new Date(now.getTime() + 30 * 24 * 3600 * 1000) },
      },
      orderBy: { dueDate: "asc" },
      include: { song: true },
    }),
  ]);

  const upcoming: AgendaItem[] = [
    ...events
      .filter((e) => e.startDate >= now)
      .map((ev) => ({
        key: `ev-${ev.id}`,
        kind: "evento" as const,
        date: ev.startDate,
        href: `/calendar/${ev.id}`,
        title: ev.title,
        song: ev.song,
        location: ev.location,
        invitesSent:
          ev.invites.length > 0
            ? `${ev.invites.filter((i) => i.status === "ENVIADA").length}/${ev.invites.length} enviadas`
            : null,
        hasTime: true,
      })),
    ...launchTasks.map((t) => ({
      key: `lt-${t.id}`,
      kind: "lanzamiento" as const,
      date: t.dueDate!,
      href: `/songs/${t.songId}?tab=marketing`,
      title: t.title,
      song: t.song,
      hasTime: false,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Agrupar por día: la proximidad crea los bloques, no una rejilla.
  const days: { key: string; label: string; date: Date; items: AgendaItem[] }[] = [];
  for (const item of upcoming) {
    const k = dayKey(item.date);
    const last = days[days.length - 1];
    if (last && last.key === k) last.items.push(item);
    else days.push({ key: k, label: dayLabel(item.date, now), date: item.date, items: [item] });
  }

  const past = events.filter((e) => e.startDate < now).reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="eyebrow mb-2">Planificación</div>
          <h1 className="display-title text-5xl sm:text-6xl">Agenda</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Tus sesiones y citas, mezcladas con los pasos de lanzamiento que
            vencen en los próximos 30 días.
          </p>
        </div>
        <Link href="/calendar/new" className="btn btn-primary">
          <Plus size={16} /> Nuevo evento
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          Nada en el horizonte.{" "}
          <Link href="/calendar/new" className="text-[var(--accent-soft)] hover:underline">
            Crea un evento
          </Link>{" "}
          o genera el plan de lanzamiento de una canción y sus pasos con fecha
          aparecerán aquí solos.
        </div>
      ) : (
        <div className="space-y-7 stagger">
          {days.map((day, i) => {
            const today = day.label === "Hoy";
            return (
              <section key={day.key} className={distanceClass(day.date, now)}>
                <div className="flex items-baseline gap-3 mb-2 px-1">
                  <h2
                    className={
                      today
                        ? "display text-lg text-white"
                        : "eyebrow"
                    }
                  >
                    {day.label}
                  </h2>
                  <div className="flex-1 h-px" style={{ background: "var(--edge)" }} />
                  <span className="text-[0.65rem] text-neutral-600">
                    {day.items.length === 1 ? "1 cosa" : `${day.items.length} cosas`}
                  </span>
                </div>
                <div className="card divide-y divide-white/[0.06] overflow-hidden">
                  {day.items.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="song-row flex items-center gap-3.5 px-5"
                      style={{
                        paddingTop: today ? "1.05rem" : i === 0 ? "0.9rem" : "0.75rem",
                        paddingBottom: today ? "1.05rem" : i === 0 ? "0.9rem" : "0.75rem",
                        ...(item.song ? { "--song": item.song.color } : {}),
                      } as React.CSSProperties}
                    >
                      {item.kind === "lanzamiento" ? (
                        <span title="Paso del plan de lanzamiento">
                          <Megaphone size={13} className="text-[var(--accent-soft)]/80 shrink-0" />
                        </span>
                      ) : (
                        item.song ? <ColorDot color={item.song.color} /> : <span className="w-2" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={today ? "font-medium text-[1.02rem]" : "font-medium text-sm"}>
                          {item.title}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-3 flex-wrap">
                          {item.hasTime && <span>{HOUR_FMT.format(item.date)} h</span>}
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {item.location}
                            </span>
                          )}
                          {item.song && <span>{item.song.title}</span>}
                          {item.invitesSent && (
                            <span className="flex items-center gap-1">
                              <Mail size={12} /> {item.invitesSent}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer select-none text-sm text-neutral-500 hover:text-neutral-300 transition-colors list-none flex items-center gap-1.5 [&::-webkit-details-marker]:hidden">
            <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
            Eventos pasados ({past.length})
          </summary>
          <div className="card divide-y divide-white/[0.06] overflow-hidden opacity-60 mt-3">
            {past.map((ev) => (
              <Link key={ev.id} href={`/calendar/${ev.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.035]">
                {ev.song && <ColorDot color={ev.song.color} />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{ev.title}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {DATETIME_FMT.format(ev.startDate)}
                    {ev.song && <span> · {ev.song.title}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
