import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SongForm from "@/components/SongForm";
import { StageBadge, TaskStatusBadge, ColorDot } from "@/components/Badges";
import {
  formatDate,
  formatMoney,
  NEXT_TASK_STATUS,
} from "@/lib/constants";
import {
  updateSong,
  deleteSong,
  addFeaturing,
  removeFeaturing,
  addProducer,
  removeProducer,
  addVideoIdea,
  toggleVideoIdea,
  removeVideoIdea,
} from "@/lib/actions/songs";
import { addTask, cycleTaskStatus, removeTask, addDistributionStep, cycleDistributionStatus, removeDistributionStep } from "@/lib/actions/tasks";
import { addBudgetItem, removeBudgetItem, addMarketingIdea, toggleMarketingIdea, removeMarketingIdea } from "@/lib/actions/marketing";
import { addRoyalty, removeRoyalty, addRoyaltyPayment, removeRoyaltyPayment } from "@/lib/actions/royalties";
import { Trash2, Link2, Video, ListChecks, Truck, Megaphone, Coins, Users2 } from "lucide-react";

export default async function SongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [song, contacts] = await Promise.all([
    prisma.song.findUnique({
      where: { id },
      include: {
        featurings: { include: { contact: true }, orderBy: { createdAt: "asc" } },
        producers: { include: { contact: true }, orderBy: { createdAt: "asc" } },
        videoIdeas: { orderBy: { createdAt: "asc" } },
        tasks: { orderBy: { createdAt: "asc" } },
        distributionSteps: { orderBy: { createdAt: "asc" } },
        marketingBudgets: { orderBy: { createdAt: "asc" } },
        marketingIdeas: { orderBy: { createdAt: "asc" } },
        royalties: { include: { contact: true, payments: true }, orderBy: { createdAt: "asc" } },
        events: { orderBy: { startDate: "asc" } },
      },
    }),
    prisma.contact.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!song) notFound();

  const updateSongWithId = updateSong.bind(null, song.id);
  const deleteSongWithId = deleteSong.bind(null, song.id);
  const totalPlanned = song.marketingBudgets.reduce((a, b) => a + b.plannedAmount, 0);
  const totalActual = song.marketingBudgets.reduce((a, b) => a + b.actualAmount, 0);
  const totalRoyaltyPct = song.royalties.reduce((a, r) => a + r.percentage, 0);

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ColorDot color={song.color} />
          <div>
            <h1 className="text-2xl font-semibold">{song.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StageBadge stage={song.stage} />
              {song.genre && <span className="text-sm text-neutral-500">{song.genre}</span>}
            </div>
          </div>
        </div>
        <form action={deleteSongWithId}>
          <button type="submit" className="btn btn-danger">
            <Trash2 size={15} /> Eliminar canción
          </button>
        </form>
      </div>

      <nav className="flex flex-wrap gap-2 text-xs">
        {[
          ["#info", "Info"],
          ["#colaboradores", "Colaboradores"],
          ["#video", "Vídeo"],
          ["#preproduccion", "Pre-producción"],
          ["#distribucion", "Distribución"],
          ["#marketing", "Marketing"],
          ["#royalties", "Royalties"],
          ["#agenda", "Agenda"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="btn btn-secondary">
            {label}
          </a>
        ))}
      </nav>

      <section id="info" className="card p-6">
        <h2 className="font-semibold mb-4">Información general</h2>
        <SongForm action={updateSongWithId} song={song} submitLabel="Guardar cambios" />
      </section>

      <section id="colaboradores" className="card p-6 space-y-6">
        <h2 className="font-semibold flex items-center gap-2">
          <Users2 size={18} /> Featuring y productores
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-neutral-300 mb-2">Featuring</h3>
            <div className="space-y-2 mb-3">
              {song.featurings.map((f) => (
                <div key={f.id} className="flex items-center justify-between text-sm bg-neutral-900 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium">{f.artistName}</span>
                    {f.role && <span className="text-neutral-500"> · {f.role}</span>}
                    {f.confirmed && <span className="badge bg-emerald-500/15 text-emerald-300 ml-2">Confirmado</span>}
                  </div>
                  <form action={removeFeaturing.bind(null, song.id, f.id)}>
                    <button type="submit" className="text-neutral-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              ))}
              {song.featurings.length === 0 && <p className="text-neutral-500 text-sm">Sin featuring aún.</p>}
            </div>
            <form action={addFeaturing.bind(null, song.id)} className="flex flex-wrap gap-2">
              <input name="artistName" placeholder="Artista" className="input flex-1 min-w-[8rem]" required />
              <input name="role" placeholder="Rol (voz, rap...)" className="input flex-1 min-w-[8rem]" />
              <select name="contactId" className="input flex-1 min-w-[8rem]">
                <option value="">Vincular contacto (opcional)</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs text-neutral-400">
                <input type="checkbox" name="confirmed" /> Confirmado
              </label>
              <button type="submit" className="btn btn-secondary">Añadir</button>
            </form>
          </div>

          <div>
            <h3 className="text-sm font-medium text-neutral-300 mb-2">Productores</h3>
            <div className="space-y-2 mb-3">
              {song.producers.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm bg-neutral-900 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium">{p.contact.name}</span>
                    {p.role && <span className="text-neutral-500"> · {p.role}</span>}
                  </div>
                  <form action={removeProducer.bind(null, song.id, p.id)}>
                    <button type="submit" className="text-neutral-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              ))}
              {song.producers.length === 0 && <p className="text-neutral-500 text-sm">Sin productores aún.</p>}
            </div>
            <form action={addProducer.bind(null, song.id)} className="flex flex-wrap gap-2">
              <select name="contactId" className="input flex-1 min-w-[8rem]" required>
                <option value="">Selecciona contacto</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input name="role" placeholder="Rol (mezcla, máster...)" className="input flex-1 min-w-[8rem]" />
              <button type="submit" className="btn btn-secondary">Añadir</button>
            </form>
            <p className="text-xs text-neutral-600 mt-2">
              ¿No existe el contacto?{" "}
              <Link href="/contacts" className="text-indigo-400 hover:underline">
                Créalo en Contactos
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section id="video" className="card p-6 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Video size={18} /> Ideas de vídeo
        </h2>
        <div className="space-y-2">
          {song.videoIdeas.map((v) => (
            <div key={v.id} className="flex items-start justify-between gap-3 bg-neutral-900 rounded-lg px-3 py-2 text-sm">
              <div className="flex-1">
                <div className="font-medium">{v.title}</div>
                {v.description && <div className="text-neutral-500 text-xs mt-0.5">{v.description}</div>}
                {v.referenceUrl && (
                  <a href={v.referenceUrl} target="_blank" className="text-indigo-400 text-xs flex items-center gap-1 mt-0.5">
                    <Link2 size={10} /> Referencia
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <form action={toggleVideoIdea.bind(null, song.id, v.id, NEXT_TASK_STATUS[v.status as keyof typeof NEXT_TASK_STATUS])}>
                  <button type="submit"><TaskStatusBadge status={v.status} /></button>
                </form>
                <form action={removeVideoIdea.bind(null, song.id, v.id)}>
                  <button type="submit" className="text-neutral-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            </div>
          ))}
          {song.videoIdeas.length === 0 && <p className="text-neutral-500 text-sm">Sin ideas de vídeo todavía.</p>}
        </div>
        <form action={addVideoIdea.bind(null, song.id)} className="flex flex-wrap gap-2 pt-2">
          <input name="title" placeholder="Idea de vídeo" className="input flex-1 min-w-[10rem]" required />
          <input name="description" placeholder="Descripción" className="input flex-1 min-w-[10rem]" />
          <input name="referenceUrl" placeholder="URL de referencia" className="input flex-1 min-w-[10rem]" />
          <button type="submit" className="btn btn-secondary">Añadir</button>
        </form>
      </section>

      <section id="preproduccion" className="card p-6 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <ListChecks size={18} /> Gestiones previas / pre-producción
        </h2>
        <div className="space-y-2">
          {song.tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 bg-neutral-900 rounded-lg px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-neutral-500 text-xs">
                  {t.assignee && <span>{t.assignee} · </span>}
                  {t.dueDate && <span>{formatDate(t.dueDate)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <form action={cycleTaskStatus.bind(null, song.id, t.id, NEXT_TASK_STATUS[t.status as keyof typeof NEXT_TASK_STATUS])}>
                  <button type="submit"><TaskStatusBadge status={t.status} /></button>
                </form>
                <form action={removeTask.bind(null, song.id, t.id)}>
                  <button type="submit" className="text-neutral-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            </div>
          ))}
          {song.tasks.length === 0 && <p className="text-neutral-500 text-sm">Sin tareas pendientes.</p>}
        </div>
        <form action={addTask.bind(null, song.id)} className="flex flex-wrap gap-2 pt-2">
          <input name="title" placeholder="Tarea (registrar SGAE, reservar estudio...)" className="input flex-1 min-w-[12rem]" required />
          <input name="assignee" placeholder="Responsable" className="input flex-1 min-w-[8rem]" />
          <input name="dueDate" type="date" className="input flex-1 min-w-[8rem]" />
          <button type="submit" className="btn btn-secondary">Añadir</button>
        </form>
      </section>

      <section id="distribucion" className="card p-6 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Truck size={18} /> Pasos con distribuidora
        </h2>
        <div className="space-y-2">
          {song.distributionSteps.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 bg-neutral-900 rounded-lg px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{d.step}</div>
                <div className="text-neutral-500 text-xs">
                  {d.distributor}
                  {d.dueDate && <span> · {formatDate(d.dueDate)}</span>}
                  {d.notes && <span> · {d.notes}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <form action={cycleDistributionStatus.bind(null, song.id, d.id, NEXT_TASK_STATUS[d.status as keyof typeof NEXT_TASK_STATUS])}>
                  <button type="submit"><TaskStatusBadge status={d.status} /></button>
                </form>
                <form action={removeDistributionStep.bind(null, song.id, d.id)}>
                  <button type="submit" className="text-neutral-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            </div>
          ))}
          {song.distributionSteps.length === 0 && <p className="text-neutral-500 text-sm">Sin pasos registrados.</p>}
        </div>
        <form action={addDistributionStep.bind(null, song.id)} className="flex flex-wrap gap-2 pt-2">
          <input name="distributor" placeholder="Distribuidora" className="input flex-1 min-w-[8rem]" required />
          <input name="step" placeholder="Paso (subir metadata...)" className="input flex-1 min-w-[10rem]" required />
          <input name="dueDate" type="date" className="input flex-1 min-w-[8rem]" />
          <input name="notes" placeholder="Notas" className="input flex-1 min-w-[8rem]" />
          <button type="submit" className="btn btn-secondary">Añadir</button>
        </form>
      </section>

      <section id="marketing" className="card p-6 space-y-6">
        <h2 className="font-semibold flex items-center gap-2">
          <Megaphone size={18} /> Marketing
        </h2>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-neutral-300">Presupuesto</h3>
            <div className="text-xs text-neutral-500">
              {formatMoney(totalActual)} gastado de {formatMoney(totalPlanned)} planificado
            </div>
          </div>
          <div className="space-y-2 mb-3">
            {song.marketingBudgets.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 bg-neutral-900 rounded-lg px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{b.category}</span>
                  <span className="text-neutral-500 text-xs ml-2">
                    {formatMoney(b.actualAmount, b.currency)} / {formatMoney(b.plannedAmount, b.currency)}
                  </span>
                  {b.notes && <div className="text-neutral-600 text-xs">{b.notes}</div>}
                </div>
                <form action={removeBudgetItem.bind(null, song.id, b.id)}>
                  <button type="submit" className="text-neutral-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            ))}
            {song.marketingBudgets.length === 0 && <p className="text-neutral-500 text-sm">Sin partidas de presupuesto.</p>}
          </div>
          <form action={addBudgetItem.bind(null, song.id)} className="flex flex-wrap gap-2">
            <input name="category" placeholder="Categoría (ads, PR...)" className="input flex-1 min-w-[8rem]" required />
            <input name="plannedAmount" type="number" step="0.01" placeholder="Planificado" className="input flex-1 min-w-[6rem]" />
            <input name="actualAmount" type="number" step="0.01" placeholder="Gastado" className="input flex-1 min-w-[6rem]" />
            <input name="currency" placeholder="EUR" className="input w-20" defaultValue="EUR" />
            <button type="submit" className="btn btn-secondary">Añadir</button>
          </form>
        </div>

        <div>
          <h3 className="text-sm font-medium text-neutral-300 mb-2">Ideas de marketing</h3>
          <div className="space-y-2 mb-3">
            {song.marketingIdeas.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 bg-neutral-900 rounded-lg px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{m.title}</span>
                  {m.channel && <span className="text-neutral-500 text-xs ml-2">{m.channel}</span>}
                  {m.description && <div className="text-neutral-600 text-xs">{m.description}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <form action={toggleMarketingIdea.bind(null, song.id, m.id, NEXT_TASK_STATUS[m.status as keyof typeof NEXT_TASK_STATUS])}>
                    <button type="submit"><TaskStatusBadge status={m.status} /></button>
                  </form>
                  <form action={removeMarketingIdea.bind(null, song.id, m.id)}>
                    <button type="submit" className="text-neutral-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {song.marketingIdeas.length === 0 && <p className="text-neutral-500 text-sm">Sin ideas todavía.</p>}
          </div>
          <form action={addMarketingIdea.bind(null, song.id)} className="flex flex-wrap gap-2">
            <input name="title" placeholder="Idea de marketing" className="input flex-1 min-w-[10rem]" required />
            <input name="channel" placeholder="Canal (TikTok...)" className="input flex-1 min-w-[8rem]" />
            <input name="description" placeholder="Descripción" className="input flex-1 min-w-[10rem]" />
            <button type="submit" className="btn btn-secondary">Añadir</button>
          </form>
        </div>
      </section>

      <section id="royalties" className="card p-6 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Coins size={18} /> Royalties
          <span className={`badge ml-2 ${totalRoyaltyPct > 100 ? "bg-red-500/15 text-red-300" : "bg-neutral-500/15 text-neutral-300"}`}>
            {totalRoyaltyPct}% repartido
          </span>
        </h2>
        <div className="space-y-3">
          {song.royalties.map((r) => (
            <div key={r.id} className="bg-neutral-900 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-medium">{r.name}</span>
                  {r.role && <span className="text-neutral-500 text-xs ml-2">{r.role}</span>}
                  <span className="text-indigo-300 text-xs ml-2">{r.percentage}%</span>
                </div>
                <form action={removeRoyalty.bind(null, song.id, r.id)}>
                  <button type="submit" className="text-neutral-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
              <div className="mt-2 pl-3 border-l border-neutral-800 space-y-1">
                {r.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs text-neutral-400">
                    <span>{formatMoney(p.amount, p.currency)} · {formatDate(p.date)} {p.notes && `· ${p.notes}`}</span>
                    <form action={removeRoyaltyPayment.bind(null, song.id, p.id)}>
                      <button type="submit" className="text-neutral-600 hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </form>
                  </div>
                ))}
                <form action={addRoyaltyPayment.bind(null, song.id, r.id)} className="flex flex-wrap gap-2 mt-1">
                  <input name="amount" type="number" step="0.01" placeholder="Importe" className="input w-24 text-xs" />
                  <input name="date" type="date" className="input w-36 text-xs" />
                  <input name="notes" placeholder="Notas" className="input flex-1 min-w-[6rem] text-xs" />
                  <button type="submit" className="btn btn-secondary text-xs py-1">Registrar pago</button>
                </form>
              </div>
            </div>
          ))}
          {song.royalties.length === 0 && <p className="text-neutral-500 text-sm">Sin splits definidos.</p>}
        </div>
        <form action={addRoyalty.bind(null, song.id)} className="flex flex-wrap gap-2 pt-2">
          <input name="name" placeholder="Nombre" className="input flex-1 min-w-[8rem]" required />
          <input name="role" placeholder="Rol (autor, productor...)" className="input flex-1 min-w-[8rem]" />
          <select name="contactId" className="input flex-1 min-w-[8rem]">
            <option value="">Vincular contacto (opcional)</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="percentage" type="number" step="0.01" placeholder="%" className="input w-24" required />
          <button type="submit" className="btn btn-secondary">Añadir</button>
        </form>
      </section>

      <section id="agenda" className="card p-6 space-y-2">
        <h2 className="font-semibold">Eventos relacionados</h2>
        {song.events.map((ev) => (
          <Link key={ev.id} href={`/calendar/${ev.id}`} className="flex items-center justify-between text-sm bg-neutral-900 rounded-lg px-3 py-2 hover:bg-neutral-800">
            <span>{ev.title}</span>
            <span className="text-neutral-500 text-xs">{formatDate(ev.startDate)}</span>
          </Link>
        ))}
        {song.events.length === 0 && (
          <p className="text-neutral-500 text-sm">
            Sin eventos vinculados.{" "}
            <Link href={`/calendar/new?songId=${song.id}`} className="text-indigo-400 hover:underline">
              Crear evento
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
