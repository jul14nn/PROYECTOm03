import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { createEvent } from "@/lib/actions/calendar";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ songId?: string }>;
}) {
  const { songId } = await searchParams;
  const userId = await requireUserId();
  const songs = await prisma.song.findMany({ where: { userId }, orderBy: { title: "asc" } });

  return (
    <div className="max-w-2xl">
      <h1 className="display-title text-5xl sm:text-6xl mb-8">Nuevo evento</h1>
      <div className="card p-6">
        <form action={createEvent} className="space-y-5">
          <div>
            <label className="label">Título *</label>
            <input name="title" className="input" required placeholder="Sesión de grabación, reunión con sello..." />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Inicio *</label>
              <input name="startDate" type="datetime-local" className="input" required />
            </div>
            <div>
              <label className="label">Fin</label>
              <input name="endDate" type="datetime-local" className="input" />
            </div>
          </div>

          <div>
            <label className="label">Ubicación</label>
            <input name="location" className="input" placeholder="Estudio, dirección, enlace de videollamada..." />
          </div>

          <div>
            <label className="label">Canción relacionada</label>
            <select name="songId" className="input" defaultValue={songId ?? ""}>
              <option value="">— Ninguna —</option>
              {songs.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea name="description" className="input" rows={3} />
          </div>

          <div>
            <label className="label">Invitar por email (uno por línea o separados por coma)</label>
            <textarea
              name="inviteEmails"
              className="input"
              rows={3}
              placeholder="productor@correo.com, featuring@correo.com"
            />
          </div>

          <button type="submit" className="btn btn-primary">Crear evento</button>
        </form>
      </div>
    </div>
  );
}
