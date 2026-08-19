import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/constants";
import { ColorDot } from "@/components/Badges";
import { MapPin, Plus, Mail } from "lucide-react";

export default async function CalendarPage() {
  const events = await prisma.calendarEvent.findMany({
    orderBy: { startDate: "asc" },
    include: { song: true, invites: true },
  });

  const now = new Date();
  const upcoming = events.filter((e) => e.startDate >= now);
  const past = events.filter((e) => e.startDate < now);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Sesiones, reuniones y citaciones, con ubicación y envío de invitaciones por email.
          </p>
        </div>
        <Link href="/calendar/new" className="btn btn-primary">
          <Plus size={16} /> Nuevo evento
        </Link>
      </div>

      <EventList title="Próximos" events={upcoming} />
      <EventList title="Pasados" events={past} muted />
    </div>
  );
}

function EventList({
  title,
  events,
  muted,
}: {
  title: string;
  events: Array<{
    id: string;
    title: string;
    location: string | null;
    startDate: Date;
    song: { title: string; color: string } | null;
    invites: { status: string }[];
  }>;
  muted?: boolean;
}) {
  if (events.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-medium text-neutral-400 mb-2">{title}</h2>
      <div className={`card divide-y divide-neutral-800 overflow-hidden ${muted ? "opacity-60" : ""}`}>
        {events.map((ev) => (
          <Link key={ev.id} href={`/calendar/${ev.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-900/60">
            {ev.song && <ColorDot color={ev.song.color} />}
            <div className="flex-1 min-w-0">
              <div className="font-medium">{ev.title}</div>
              <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-3 flex-wrap">
                <span>{formatDateTime(ev.startDate)}</span>
                {ev.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {ev.location}
                  </span>
                )}
                {ev.song && <span>{ev.song.title}</span>}
                {ev.invites.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Mail size={12} /> {ev.invites.filter((i) => i.status === "ENVIADA").length}/{ev.invites.length} enviadas
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
