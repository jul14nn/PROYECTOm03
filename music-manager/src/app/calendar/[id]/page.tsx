import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/constants";
import { addInvite, removeInvite, deleteEvent } from "@/lib/actions/calendar";
import { SendInviteButton, SendAllButton } from "@/components/InviteActions";
import { MapPin, Trash2, Mail } from "lucide-react";

const INVITE_STATUS_STYLE: Record<string, string> = {
  PENDIENTE: "bg-neutral-500/15 text-neutral-300",
  ENVIADA: "bg-emerald-500/15 text-emerald-300",
  ACEPTADA: "bg-sky-500/15 text-sky-300",
  RECHAZADA: "bg-red-500/15 text-red-300",
};

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, contacts] = await Promise.all([
    prisma.calendarEvent.findUnique({
      where: { id },
      include: { song: true, invites: { include: { contact: true }, orderBy: { createdAt: "asc" } } },
    }),
    prisma.contact.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!event) notFound();

  const pendingCount = event.invites.filter((i) => i.status === "PENDIENTE").length;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{event.title}</h1>
          <div className="text-sm text-neutral-400 mt-1 space-y-1">
            <div>{formatDateTime(event.startDate)}</div>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin size={13} /> {event.location}
              </div>
            )}
            {event.song && (
              <div>
                Canción:{" "}
                <Link href={`/songs/${event.song.id}`} className="text-indigo-400 hover:underline">
                  {event.song.title}
                </Link>
              </div>
            )}
          </div>
        </div>
        <form action={deleteEvent.bind(null, event.id)}>
          <button type="submit" className="btn btn-danger">
            <Trash2 size={15} /> Eliminar
          </button>
        </form>
      </div>

      {event.description && <p className="text-sm text-neutral-300">{event.description}</p>}

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Mail size={16} /> Invitaciones por email
          </h2>
          {pendingCount > 0 && <SendAllButton eventId={event.id} />}
        </div>

        <div className="space-y-2">
          {event.invites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between gap-3 bg-neutral-900 rounded-lg px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{inv.contact?.name ?? inv.email}</div>
                <div className="text-xs text-neutral-500">{inv.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${INVITE_STATUS_STYLE[inv.status] ?? ""}`}>{inv.status}</span>
                {inv.status === "PENDIENTE" && <SendInviteButton eventId={event.id} inviteId={inv.id} />}
                <form action={removeInvite.bind(null, event.id, inv.id)}>
                  <button type="submit" className="text-neutral-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            </div>
          ))}
          {event.invites.length === 0 && <p className="text-neutral-500 text-sm">Sin invitados todavía.</p>}
        </div>

        <form action={addInvite.bind(null, event.id)} className="flex flex-wrap gap-2 pt-2">
          <select name="contactId" className="input flex-1 min-w-[8rem]">
            <option value="">Contacto (opcional)</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="email" type="email" placeholder="Email del invitado" className="input flex-1 min-w-[10rem]" required />
          <button type="submit" className="btn btn-secondary">Añadir invitado</button>
        </form>
      </section>
    </div>
  );
}
