import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import SubmitButton, { IconSubmit } from "@/components/SubmitButton";
import { addPost, removePost } from "@/lib/actions/results";
import {
  conclusiones,
  porFormato,
  porPlataforma,
  engagement,
  compacto,
  decimal,
  nombrePlataforma,
  PLATAFORMAS,
  FORMATOS_SUGERIDOS,
  type Post,
  type Plataforma,
} from "@/lib/results";
import Vu from "@/components/Vu";
import { ColorDot } from "@/components/Badges";
import { Trash2, Lightbulb, AlertTriangle, Plus, ExternalLink } from "lucide-react";

const FECHA = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });

export default async function ResultadosPage() {
  const userId = await requireUserId();

  const [filas, songs] = await Promise.all([
    prisma.contentPost.findMany({
      where: { userId },
      orderBy: { postedAt: "desc" },
      include: { song: { select: { title: true, color: true } } },
    }),
    prisma.song.findMany({
      where: { userId },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  const posts: Post[] = filas.map((p) => ({
    id: p.id,
    songId: p.songId,
    songTitle: p.song?.title ?? null,
    platform: p.platform as Plataforma,
    format: p.format,
    postedAt: p.postedAt,
    views: p.views,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    saves: p.saves,
  }));

  const findings = conclusiones(posts);
  const formatos = porFormato(posts);
  const plataformas = porPlataforma(posts);
  const techo = Math.max(1, ...formatos.map((f) => f.mediaVistas));

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div>
        <div className="eyebrow mb-2">Aprendizaje</div>
        <h1 className="display-title text-5xl sm:text-6xl">Resultados</h1>
        <p className="text-neutral-400 text-sm mt-3 max-w-lg">
          Lo que publicas y lo que consigue. Sin esto, cada lanzamiento
          empieza de cero y repites lo que no funciona sin saberlo.
        </p>
      </div>

      {/* ------------------------------------------------------ Conclusiones */}
      <div className="card card-featured p-6">
        <h2 className="eyebrow mb-4 flex items-center gap-2">
          <Lightbulb size={14} /> Qué te está funcionando
        </h2>
        <ul className="space-y-3">
          {findings.map((c, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              {c.tono === "aviso" ? (
                <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
              ) : (
                <span
                  className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                  style={{
                    background: c.tono === "bueno" ? "#34d399" : "var(--text-dimmer)",
                  }}
                />
              )}
              <span className={c.tono === "bueno" ? "text-neutral-200" : "text-neutral-400"}>
                {c.texto}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* -------------------------------------------------- Formato / plataforma */}
      {formatos.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-6">
            <h2 className="eyebrow mb-4">Por formato</h2>
            <div className="space-y-4">
              {formatos.map((g) => (
                <div key={g.clave}>
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className="text-sm truncate">{g.clave}</span>
                    <span className="text-xs text-neutral-500 shrink-0">
                      <span className="numeral text-neutral-200">{compacto(g.mediaVistas)}</span>{" "}
                      de media · {g.n}
                    </span>
                  </div>
                  <Vu value={g.mediaVistas / techo} segments={20} label={`Media de ${g.clave}`} />
                  <p className="text-[0.68rem] text-neutral-600 mt-1">
                    {decimal(g.mediaEngagement)} interacciones por cada 100 visitas
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="eyebrow mb-4">Por plataforma</h2>
            <div className="space-y-3">
              {plataformas.map((g) => (
                <div key={g.clave} className="tile px-3 py-2.5 flex items-center gap-3">
                  <span className="text-sm flex-1">{nombrePlataforma(g.clave as Plataforma)}</span>
                  <span className="text-xs text-neutral-500">{g.n} pub.</span>
                  <span className="numeral text-sm">{compacto(g.mediaVistas)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- Registrar */}
      <div className="card p-6">
        <h2 className="font-semibold flex items-center gap-2">
          <Plus size={17} /> Anotar una publicación
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Copia los números tal cual los ves: entiende «12,4K» y «1.234».
        </p>

        <form action={addPost} className="mt-4 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <label>
              <span className="label">Formato *</span>
              <input
                name="format"
                list="formatos"
                required
                placeholder="Clip con letra"
                className="input"
              />
              <datalist id="formatos">
                {FORMATOS_SUGERIDOS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </label>
            <label>
              <span className="label">Plataforma</span>
              <select name="platform" className="input" defaultValue="TIKTOK">
                {PLATAFORMAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Canción</span>
              <select name="songId" className="input">
                <option value="">Ninguna en concreto</option>
                {songs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <label>
              <span className="label">Fecha</span>
              <input name="postedAt" type="date" className="input" />
            </label>
            <label>
              <span className="label">Visitas</span>
              <input name="views" inputMode="numeric" placeholder="12,4K" className="input" />
            </label>
            <label>
              <span className="label">Me gusta</span>
              <input name="likes" inputMode="numeric" className="input" />
            </label>
            <label>
              <span className="label">Comentarios</span>
              <input name="comments" inputMode="numeric" className="input" />
            </label>
            <label>
              <span className="label">Compartidos</span>
              <input name="shares" inputMode="numeric" className="input" />
            </label>
            <label>
              <span className="label">Guardados</span>
              <input name="saves" inputMode="numeric" className="input" />
            </label>
          </div>

          <label className="block">
            <span className="label">Enlace (opcional)</span>
            <input name="url" placeholder="https://…" className="input" />
          </label>

          <SubmitButton pendingLabel="Guardando…">Anotar</SubmitButton>
        </form>
      </div>

      {/* ------------------------------------------------------- Publicaciones */}
      <div className="card overflow-hidden">
        <h2 className="eyebrow px-6 pt-6 pb-3">Lo que llevas publicado</h2>
        {posts.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-neutral-500">
            Nada todavía. Empieza por la última pieza que subiste — aunque fuera
            hace semanas, los números siguen ahí.
          </p>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filas.map((p) => {
              const post = posts.find((x) => x.id === p.id)!;
              return (
                <div
                  key={p.id}
                  className="song-row flex items-center gap-3 px-6 py-3.5"
                  style={
                    p.song ? ({ "--song": p.song.color } as React.CSSProperties) : undefined
                  }
                >
                  {p.song && <ColorDot color={p.song.color} />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm flex items-center gap-2 flex-wrap">
                      <span>{p.format}</span>
                      <span className="text-neutral-600 text-xs">
                        {nombrePlataforma(p.platform as Plataforma)}
                      </span>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent-soft)]"
                          aria-label="Abrir publicación"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {FECHA.format(p.postedAt)}
                      {p.song && ` · ${p.song.title}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="numeral text-sm">{compacto(p.views)}</div>
                    <div className="text-[0.65rem] text-neutral-600">
                      {decimal(engagement(post))}% eng.
                    </div>
                  </div>
                  <form action={removePost.bind(null, p.id)}>
                    <IconSubmit
                      label="Borrar publicación"
                      confirm="¿Borrar esta publicación?"
                      className="text-neutral-600 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </IconSubmit>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-neutral-600">
        ¿No sabes qué publicar? El{" "}
        <Link href="/marketing" className="text-[var(--accent-soft)] hover:underline">
          plan de lanzamiento
        </Link>{" "}
        te dice qué toca cada semana.
      </p>
    </div>
  );
}
