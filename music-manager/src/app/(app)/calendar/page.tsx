import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/constants";
import { ColorDot } from "@/components/Badges";
import { MapPin, Plus, Mail, Megaphone, ChevronDown } from "lucide-react";

/**
 * La agenda junta dos mundos que antes vivían separados: los eventos con
 * hora (sesiones, reuniones) y los pasos del plan de lanzamiento con fecha.
 * "¿Qué tengo esta semana?" debe tener una sola respuesta.
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
          <Link href="/calendar/new" className="text-fuchsia-400 hover:underline">
            Crea un evento
          </Link>{" "}
          o genera el plan de lanzamiento de una canción y sus pasos con fecha
          aparecerán aquí solos.
        </div>
      ) : (
        <div className="card divide-y divide-white/[0.06] overflow-hidden">
          {upcoming.map((item) => (
            <Link key={item.key} href={item.href} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.035]">
              {item.song && <ColorDot color={item.song.color} />}
              <div className="flex-1 min-w-0">
                <div className="font-medium flex items-center gap-2">
                  {item.title}
                  {item.kind === "lanzamiento" && (
                    <span className="badge bg-fuchsia-500/10 text-fuchsia-300 flex items-center gap-1">
                      <Megaphone size={10} /> lanzamiento
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-3 flex-wrap">
                  <span>{item.hasTime ? formatDateTime(item.date) : formatDate(item.date)}</span>
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
                    {formatDateTime(ev.startDate)}
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
