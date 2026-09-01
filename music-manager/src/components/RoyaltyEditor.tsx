import Link from "next/link";
import { Trash2, FileText } from "lucide-react";
import { formatMoney, formatDate } from "@/lib/constants";
import SubmitButton, { IconSubmit } from "@/components/SubmitButton";
import {
  addRoyalty,
  removeRoyalty,
  addRoyaltyPayment,
  removeRoyaltyPayment,
} from "@/lib/actions/royalties";

type Pago = {
  id: string;
  amount: number;
  currency: string;
  date: Date;
  notes: string | null;
};

type Reparto = {
  id: string;
  name: string;
  role: string | null;
  percentage: number;
  payments: Pago[];
};

/**
 * Alta y edición del reparto de una canción.
 *
 * Vivía dentro de la ficha, en una pestaña propia que duplicaba la página de
 * Royalties. Al sacarla de allí había que llevarse el editor entero, no solo
 * el enlace: la página global era de solo lectura, así que sin esto no
 * quedaría ninguna forma de crear un reparto — y de que exista depende el
 * acuerdo y el registro en la SGAE.
 */
export default function RoyaltyEditor({
  songId,
  royalties,
  contacts,
}: {
  songId: string;
  royalties: Reparto[];
  contacts: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {royalties.map((r) => (
          <div key={r.id} className="tile px-3 py-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-medium">{r.name}</span>
                {r.role && <span className="text-neutral-500 text-xs ml-2">{r.role}</span>}
                <span className="text-[var(--accent-soft)] text-xs ml-2">{r.percentage}%</span>
              </div>
              <form action={removeRoyalty.bind(null, songId, r.id)}>
                <IconSubmit label="Quitar" className="text-neutral-500 hover:text-red-400">
                  <Trash2 size={14} />
                </IconSubmit>
              </form>
            </div>
            <div className="mt-2 pl-3 border-l border-white/[0.07] space-y-1">
              {r.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs text-neutral-400">
                  <span>
                    {formatMoney(p.amount, p.currency)} · {formatDate(p.date)}
                    {p.notes && ` · ${p.notes}`}
                  </span>
                  <form action={removeRoyaltyPayment.bind(null, songId, p.id)}>
                    <IconSubmit label="Quitar" className="text-neutral-600 hover:text-red-400">
                      <Trash2 size={12} />
                    </IconSubmit>
                  </form>
                </div>
              ))}
              <form
                action={addRoyaltyPayment.bind(null, songId, r.id)}
                className="flex flex-wrap gap-2 mt-1"
              >
                <input name="amount" type="number" step="0.01" placeholder="Importe" className="input w-24 text-xs" />
                <input name="date" type="date" className="input w-36 text-xs" />
                <input name="notes" placeholder="Notas" className="input flex-1 min-w-[6rem] text-xs" />
                <button type="submit" className="btn btn-secondary text-xs py-1">Registrar pago</button>
              </form>
            </div>
          </div>
        ))}
        {royalties.length === 0 && <p className="text-neutral-500 text-sm">Sin splits definidos.</p>}
      </div>

      <form action={addRoyalty.bind(null, songId)} className="flex flex-wrap gap-2 pt-2">
        <input name="name" placeholder="Nombre" className="input flex-1 min-w-[8rem]" required />
        <input name="role" placeholder="Rol (autor, productor...)" className="input flex-1 min-w-[8rem]" />
        <select name="contactId" className="input flex-1 min-w-[8rem]">
          <option value="">Vincular contacto (opcional)</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="kind" className="input w-32" aria-label="Tipo de reparto">
          <option value="OBRA">Obra</option>
          <option value="MASTER">Máster</option>
        </select>
        <input name="percentage" type="number" step="0.01" placeholder="%" className="input w-24" required />
        <SubmitButton className="btn btn-secondary" pendingLabel="Añadiendo…">Añadir</SubmitButton>
      </form>

      <Link href={`/songs/${songId}/contrato`} className="btn btn-secondary mt-2">
        <FileText size={15} /> Preparar el acuerdo de reparto
      </Link>
    </div>
  );
}
