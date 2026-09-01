import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { formatMoney } from "@/lib/constants";
import { ColorDot } from "@/components/Badges";
import RoyaltyEditor from "@/components/RoyaltyEditor";
import { AlertTriangle, Download, CheckCircle2, ChevronRight } from "lucide-react";

/* Cada persona del reparto recibe un color estable por posición: la barra
   se lee de un vistazo sin leyenda aparte. */
const SPLIT_COLORS = ["#9333ea", "#e0299e", "#f6a723", "#10b981", "#38bdf8", "#f87171"];

export default async function RoyaltiesPage() {
  const userId = await requireUserId();
  // Todas las canciones, no solo las que ya tienen reparto: el alta se hace
  // aquí desde que dejó de existir la pestaña de la ficha, y filtrando por
  // "las que ya tienen" no habría forma de empezar el primero.
  const [songs, contacts] = await Promise.all([
    prisma.song.findMany({
      where: { userId },
      include: { royalties: { include: { payments: true }, orderBy: { createdAt: "asc" } } },
      orderBy: { title: "asc" },
    }),
    prisma.contact.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  const totalPaid = songs
    .flatMap((s) => s.royalties)
    .flatMap((r) => r.payments)
    .reduce((a, p) => a + p.amount, 0);

  // Solo cuentan como roto los repartos empezados: una canción sin reparto
  // todavía no está mal, simplemente no ha llegado su momento.
  const broken = songs.filter(
    (s) =>
      s.royalties.length > 0 &&
      s.royalties.reduce((a, r) => a + r.percentage, 0) !== 100
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow mb-2">Reparto</div>
          <h1 className="display-title text-5xl sm:text-6xl">Royalties</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Splits por canción y pagos registrados. Total pagado: {formatMoney(totalPaid)}.
          </p>
        <Link href="/guias/sgae" className="text-sm text-[var(--accent-soft)] hover:underline mt-2 inline-block">
          Cómo darte de alta en la SGAE y registrar tus canciones
        </Link>
        </div>
        {songs.length > 0 && (
          <a href="/api/export/royalties" className="btn btn-secondary shrink-0" download>
            <Download size={14} /> Exportar CSV
          </a>
        )}
      </div>

      {broken.length > 0 && (
        <div className="card p-4 border-amber-500/30 flex items-start gap-3 text-sm">
          <AlertTriangle size={17} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-amber-200 font-medium">
              {broken.length === 1
                ? "Hay una canción cuyo reparto no suma 100%."
                : `Hay ${broken.length} canciones cuyo reparto no suma 100%.`}
            </span>{" "}
            <span className="text-neutral-400">
              Un split mal cerrado es una discusión el día que llegue el primer
              ingreso. Están marcadas abajo.
            </span>
          </div>
        </div>
      )}

      {songs.length === 0 && (
        <div className="card p-10 text-center text-neutral-500">
          Todavía no tienes canciones.{" "}
          <Link href="/songs/new" className="text-[var(--accent-soft)] hover:underline">
            Crea la primera
          </Link>{" "}
          y podrás repartir sus porcentajes aquí.
        </div>
      )}

      <div className="space-y-4 stagger">
        {songs.map((song) => {
          const total = song.royalties.reduce((a, r) => a + r.percentage, 0);
          const paid = song.royalties.flatMap((r) => r.payments).reduce((a, p) => a + p.amount, 0);
          // Sin reparto todavía no es un error: la alarma es para el que
          // está empezado y no cuadra. Antes de sacar el editor a esta
          // página no había canciones vacías aquí y no se notaba.
          const vacia = song.royalties.length === 0;
          const ok = total === 100;
          return (
            <div
              key={song.id}
              className="card song-tint p-5"
              /* El ámbar de aviso debe ganar al tinte: va en línea. */
              style={{
                "--song": song.color,
                ...(ok || vacia ? {} : { borderColor: "rgba(245, 158, 11, 0.35)" }),
              } as React.CSSProperties}
            >
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <Link href={`/songs/${song.id}`} className="flex items-center gap-2 font-medium hover:underline">
                  <ColorDot color={song.color} /> {song.title}
                </Link>
                <div className="flex items-center gap-3 text-xs">
                  {vacia ? (
                    <span className="text-neutral-500">sin reparto</span>
                  ) : ok ? (
                    <span className="flex items-center gap-1 text-emerald-300">
                      <CheckCircle2 size={13} /> 100% cerrado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-300 font-medium">
                      <AlertTriangle size={13} />
                      {total < 100 ? `Faltan ${100 - total}%` : `Sobran ${total - 100}%`}
                    </span>
                  )}
                  {!vacia && <span className="text-neutral-500">{formatMoney(paid)} pagado</span>}
                </div>
              </div>

              {/* La barra: el reparto entero de un vistazo. El hueco gris al
                  final es literalmente el porcentaje sin asignar. */}
              <div className="meter flex mb-3">
                {song.royalties.map((r, i) => (
                  <div
                    key={r.id}
                    style={{
                      width: `${Math.min(r.percentage, 100)}%`,
                      background: SPLIT_COLORS[i % SPLIT_COLORS.length],
                    }}
                  />
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                {song.royalties.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between text-sm gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: SPLIT_COLORS[i % SPLIT_COLORS.length] }}
                      />
                      <span className="truncate">
                        {r.name} {r.role && <span className="text-neutral-500">· {r.role}</span>}
                      </span>
                    </span>
                    <span className="text-neutral-400 numeral shrink-0">{r.percentage}%</span>
                  </div>
                ))}
              </div>

              {/* El editor va plegado: esta página se usa sobre todo para
                  mirar si los repartos cuadran, y con ocho formularios
                  abiertos a la vez eso deja de verse. */}
              <details className="group mt-4">
                <summary className="cursor-pointer select-none text-sm text-neutral-500 hover:text-neutral-200 transition-colors list-none [&::-webkit-details-marker]:hidden flex items-center gap-1.5">
                  <ChevronRight size={14} className="transition-transform group-open:rotate-90" />
                  {song.royalties.length === 0 ? "Repartir esta canción" : "Editar el reparto y los pagos"}
                </summary>
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <RoyaltyEditor
                    songId={song.id}
                    royalties={song.royalties}
                    contacts={contacts}
                  />
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
