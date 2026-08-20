import { prisma } from "@/lib/prisma";
import SubmitButton, { IconSubmit } from "@/components/SubmitButton";
import { requireUserId } from "@/lib/auth";
import { createContact, updateContact, deleteContact } from "@/lib/actions/contacts";
import { Trash2, Mail, Phone, Plus, Pencil, ChevronDown } from "lucide-react";

export default async function ContactsPage() {
  const userId = await requireUserId();
  const contacts = await prisma.contact.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { producedSongs: true, featurings: true, royalties: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="eyebrow mb-2">Equipo</div>
        <h1 className="display-title text-5xl sm:text-6xl">Contactos</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Productores, featuring, distribuidoras y demás personas del proyecto.
        </p>
      </div>

      {/* El alta vive plegada: el listado es lo que se consulta a diario. */}
      <details className="card overflow-hidden group" open={contacts.length === 0}>
        <summary className="flex items-center gap-2 px-6 py-4 cursor-pointer select-none font-semibold text-sm list-none [&::-webkit-details-marker]:hidden">
          <Plus size={15} /> Nuevo contacto
          <ChevronDown size={15} className="ml-auto text-neutral-500 transition-transform group-open:rotate-180" />
        </summary>
        <form action={createContact} className="px-6 pb-6 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre *</label>
            <input name="name" className="input" required />
          </div>
          <div>
            <label className="label">Rol</label>
            <input name="role" className="input" placeholder="Productor, Featuring, Distribuidora..." />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input" />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input name="phone" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notas</label>
            <textarea name="notes" className="input" rows={2} />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton pendingLabel="Añadiendo…">Añadir contacto</SubmitButton>
          </div>
        </form>
      </details>

      <div className="card divide-y divide-white/[0.06] overflow-hidden stagger">
        {contacts.map((c) => (
          <details key={c.id} className="group/row">
            <summary className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden row-hover">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  {c.role && <span className="badge bg-neutral-500/15 text-neutral-300">{c.role}</span>}
                </div>
                <div className="text-xs text-neutral-500 mt-1 flex items-center gap-3 flex-wrap">
                  {c.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} /> {c.email}
                    </span>
                  )}
                  {c.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {c.phone}
                    </span>
                  )}
                  {c._count.producedSongs > 0 && <span>{c._count.producedSongs} producción(es)</span>}
                  {c._count.featurings > 0 && <span>{c._count.featurings} featuring(s)</span>}
                  {c._count.royalties > 0 && <span>{c._count.royalties} royalty(s)</span>}
                </div>
                {c.notes && <div className="text-xs text-neutral-600 mt-1">{c.notes}</div>}
              </div>
              <Pencil size={14} className="text-neutral-600 group-open/row:text-fuchsia-400 shrink-0" />
            </summary>

            <div className="px-5 pb-5 pt-1">
              <form action={updateContact.bind(null, c.id)} className="grid sm:grid-cols-2 gap-3 tile p-4">
                <div>
                  <label className="label">Nombre *</label>
                  <input name="name" defaultValue={c.name} className="input" required />
                </div>
                <div>
                  <label className="label">Rol</label>
                  <input name="role" defaultValue={c.role ?? ""} className="input" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input name="email" type="email" defaultValue={c.email ?? ""} className="input" />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input name="phone" defaultValue={c.phone ?? ""} className="input" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Notas</label>
                  <textarea name="notes" defaultValue={c.notes ?? ""} className="input" rows={2} />
                </div>
                <div className="sm:col-span-2">
                  <SubmitButton className="btn btn-secondary" pendingLabel="Guardando…">
                    Guardar cambios
                  </SubmitButton>
                </div>
              </form>
              {/* El borrado va en su propio form: anidarlo dentro del de
                  edición haría que el navegador lo fusionara con aquel. */}
              <div className="flex justify-end mt-2">
                <DeleteContactButton id={c.id} />
              </div>
            </div>
          </details>
        ))}
        {contacts.length === 0 && (
          <div className="px-5 py-10 text-center text-neutral-500">Sin contactos todavía.</div>
        )}
      </div>
    </div>
  );
}

function DeleteContactButton({ id }: { id: string }) {
  return (
    <form action={deleteContact.bind(null, id)}>
      <IconSubmit
        label="Eliminar contacto"
        confirm="¿Eliminar este contacto?"
        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-400 transition-colors"
      >
        <Trash2 size={13} /> Eliminar contacto
      </IconSubmit>
    </form>
  );
}
