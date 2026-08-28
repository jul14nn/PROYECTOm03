import Link from "next/link";
import SubmitButton, { IconSubmit } from "@/components/SubmitButton";
import { addSnapshot, removeSnapshot } from "@/lib/actions/results";
import { compacto } from "@/lib/results";
import { Trash2, TrendingUp } from "lucide-react";

const FECHA = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });

export type Snapshot = {
  id: string;
  takenAt: Date;
  streams: number;
  listeners: number;
  saves: number;
  playlists: number;
};

/**
 * Cómo va la canción, medido de verdad.
 *
 * Se guardan instantáneas en vez de un total acumulado porque lo que enseña
 * no es el número sino la pendiente: si la segunda semana cae en picado o si
 * una playlist la levantó.
 */
export default function SongResults({
  songId,
  snapshots,
  posts,
}: {
  songId: string;
  snapshots: Snapshot[];
  posts: { views: number }[];
}) {
  const orden = [...snapshots].sort((a, b) => a.takenAt.getTime() - b.takenAt.getTime());
  const ultima = orden[orden.length - 1] ?? null;
  const previa = orden[orden.length - 2] ?? null;
  const delta = ultima && previa ? ultima.streams - previa.streams : null;
  const alcance = posts.reduce((a, p) => a + p.views, 0);

  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="font-semibold flex items-center gap-2">
          <TrendingUp size={18} /> Cómo va
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Apunta las escuchas de vez en cuando. Lo que enseña no es el total,
          sino cuánto sube entre una anotación y la siguiente.
        </p>
      </div>

      {ultima && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Escuchas", v: compacto(ultima.streams) },
            { l: "Oyentes", v: compacto(ultima.listeners) },
            { l: "Guardados", v: compacto(ultima.saves) },
            { l: "En playlists", v: compacto(ultima.playlists) },
          ].map((m) => (
            <div key={m.l} className="tile p-3">
              <div className="numeral text-xl">{m.v}</div>
              <div className="text-[0.65rem] text-neutral-500 mt-0.5">{m.l}</div>
            </div>
          ))}
        </div>
      )}

      {delta !== null && previa && (
        <p className="text-sm text-neutral-400">
          {delta > 0 ? (
            <>
              <span className="text-emerald-400">+{compacto(delta)}</span> escuchas
              desde el {FECHA.format(previa.takenAt)}.
            </>
          ) : delta === 0 ? (
            <>Sin cambios desde el {FECHA.format(previa.takenAt)}.</>
          ) : (
            <>
              El número ha bajado desde el {FECHA.format(previa.takenAt)}: revisa
              si anotaste bien alguna de las dos cifras.
            </>
          )}
        </p>
      )}

      {alcance > 0 && (
        <p className="text-sm text-neutral-400">
          Tus publicaciones de esta canción suman{" "}
          <span className="numeral text-neutral-200">{compacto(alcance)}</span>{" "}
          visitas.{" "}
          <Link href="/resultados" className="text-[var(--accent-soft)] hover:underline">
            Ver qué formato funciona
          </Link>
          .
        </p>
      )}

      <form action={addSnapshot.bind(null, songId)} className="grid sm:grid-cols-5 gap-3">
        <label>
          <span className="label">Fecha</span>
          <input name="takenAt" type="date" className="input" />
        </label>
        <label>
          <span className="label">Escuchas</span>
          <input name="streams" inputMode="numeric" placeholder="1,2K" className="input" />
        </label>
        <label>
          <span className="label">Oyentes</span>
          <input name="listeners" inputMode="numeric" className="input" />
        </label>
        <label>
          <span className="label">Guardados</span>
          <input name="saves" inputMode="numeric" className="input" />
        </label>
        <label>
          <span className="label">Playlists</span>
          <input name="playlists" inputMode="numeric" className="input" />
        </label>
        <div className="sm:col-span-5">
          <SubmitButton className="btn btn-secondary" pendingLabel="Guardando…">
            Anotar
          </SubmitButton>
        </div>
      </form>

      {orden.length > 0 && (
        <ul className="space-y-1.5">
          {[...orden].reverse().map((s) => (
            <li key={s.id} className="flex items-center gap-3 text-xs tile px-3 py-2">
              <span className="text-neutral-500 w-16 shrink-0">{FECHA.format(s.takenAt)}</span>
              <span className="flex-1 numeral">{compacto(s.streams)} escuchas</span>
              <span className="text-neutral-600">{compacto(s.listeners)} oyentes</span>
              <form action={removeSnapshot.bind(null, s.id, songId)}>
                <IconSubmit label="Borrar anotación" className="text-neutral-600 hover:text-red-400">
                  <Trash2 size={13} />
                </IconSubmit>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
