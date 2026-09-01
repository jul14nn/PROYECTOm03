import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import SongForm from "@/components/SongForm";
import SongWorkspace, { type SongTab } from "@/components/SongWorkspace";
import VideoGenerator from "@/components/VideoGenerator";
import ClipStudio from "@/components/ClipStudio";
import AssetUploader from "@/components/AssetUploader";
import AssetList from "@/components/AssetList";
import { DEFAULT_FONT_ID } from "@/lib/loadFont";
import type { SubtitleStyleId } from "@/lib/subtitleStyles";
import { StageBadge, TaskStatusBadge, ColorDot } from "@/components/Badges";
import {
  formatDate,
  formatDateApprox,
  NEXT_TASK_STATUS,
} from "@/lib/constants";
import { daysUntil, tiktokPlanFor } from "@/lib/tiktokPlan";
import { getNextStep } from "@/lib/nextStep";
import {
  updateSong,
  deleteSong,
  addFeaturing,
  removeFeaturing,
  addProducer,
  removeProducer,
  updateSongLyrics,
} from "@/lib/actions/songs";
import { addTask, cycleTaskStatus, removeTask } from "@/lib/actions/tasks";
import { generateLaunchPlan, resyncLaunchPlan } from "@/lib/actions/launch";
import LaunchPlan from "@/components/LaunchPlan";
import SubmitButton, { IconSubmit } from "@/components/SubmitButton";
import { LAUNCH_STEPS, PHASES } from "@/lib/launchPlan";
import { addSongReference, removeSongReference } from "@/lib/actions/references";
import { isBlobConfigured } from "@/lib/blob";
import SongResults from "@/components/SongResults";
import {
  Trash2,
  Video,
  ListChecks,
  Megaphone,
  Coins,
  Users2,
  Images,
  Sparkles,
  Info,
  Wand2,
  CalendarDays,
  Scissors,
  MicVocal,
  } from "lucide-react";

export default async function SongDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const userId = await requireUserId();

  const [song, contacts, brandKit, fonts] = await Promise.all([
    prisma.song.findFirst({
      where: { id, userId },
      include: {
        featurings: { include: { contact: true }, orderBy: { createdAt: "asc" } },
        producers: { include: { contact: true }, orderBy: { createdAt: "asc" } },
        tasks: { orderBy: { createdAt: "asc" } },
        royalties: { include: { contact: true, payments: true }, orderBy: { createdAt: "asc" } },
        events: { orderBy: { startDate: "asc" } },
        references: { orderBy: { createdAt: "desc" } },
        launchTasks: { orderBy: { dayOffset: "asc" } },
        assets: { orderBy: { createdAt: "desc" } },
        snapshots: { orderBy: { takenAt: "desc" } },
        posts: { select: { views: true } },
      },
    }),
    prisma.contact.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.brandKit.findUnique({ where: { userId } }),
    prisma.asset.findMany({
      where: { userId, kind: "FONT" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!song) notFound();

  const updateSongWithId = updateSong.bind(null, song.id);
  const deleteSongWithId = deleteSong.bind(null, song.id);
  const generateLaunchPlanWithId = generateLaunchPlan.bind(null, song.id);
  const resyncLaunchPlanWithId = resyncLaunchPlan.bind(null, song.id);
  const totalRoyaltyPct = song.royalties.reduce((a, r) => a + r.percentage, 0);
  const days = song.releaseDate ? daysUntil(song.releaseDate) : null;
  const tiktokPlan = days !== null && days >= 0 ? tiktokPlanFor(days) : null;
  const nextStep = getNextStep(song);
  const brand = {
    primaryColor: brandKit?.primaryColor ?? "#9333ea",
    secondaryColor: brandKit?.secondaryColor ?? "#e0299e",
    fontFamily: brandKit?.fontFamily ?? DEFAULT_FONT_ID,
    subtitleStyle: (brandKit?.subtitleStyle ?? "barra") as SubtitleStyleId,
    subtitlePosPct: brandKit?.subtitlePosPct ?? 78,
    subtitleScale: brandKit?.subtitleScale ?? 1,
    defaultVideoStyle: brandKit?.defaultVideoStyle ?? "neon",
  };

  const videoAssets = song.assets
    .filter((a) => a.kind === "VIDEO")
    .map((a) => ({ id: a.id, name: a.name, url: a.url }));
  const audioAssets = song.assets
    .filter((a) => a.kind === "AUDIO")
    .map((a) => ({ id: a.id, name: a.name, url: a.url }));
  const fontAssets = fonts.map((a) => ({ id: a.id, name: a.name, url: a.url }));
  const blobOn = isBlobConfigured();

  const tabs: SongTab[] = [
    {
      id: "info",
      label: "Info",
      icon: <Info size={15} />,
      content: (
        <>
          <div className="card p-6">
            <h2 className="eyebrow mb-4">Información general</h2>
            <SongForm action={updateSongWithId} song={song} submitLabel="Guardar cambios" />
          </div>

          {/* Lo que antes tenía pestaña propia y no la merecía: la agenda y
              el reparto se ven enteros en sus páginas, aquí basta el enlace
              con lo que hay. */}
          <div className="card p-6 space-y-3">
            <h2 className="eyebrow">En otras secciones</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              <Link href="/calendar" className="tile px-3 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-white/[0.05] transition-colors">
                <span className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-neutral-500" /> Agenda
                </span>
                <span className="text-xs text-neutral-500">
                  {song.events.length === 0 ? "sin eventos" : `${song.events.length} evento${song.events.length === 1 ? "" : "s"}`}
                </span>
              </Link>
              <Link href="/royalties" className="tile px-3 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-white/[0.05] transition-colors">
                <span className="flex items-center gap-2">
                  <Coins size={15} className="text-neutral-500" /> Royalties
                </span>
                <span className="text-xs text-neutral-500">
                  {song.royalties.length === 0 ? "sin reparto" : `${totalRoyaltyPct}% repartido`}
                </span>
              </Link>
            </div>
          </div>

          {/* Borrar una canción se hace una vez en la vida de la canción, y
              estaba arriba a la derecha en rojo en cada visita. */}
          <div className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Eliminar esta canción</div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Se borran también su plan, su reparto, sus referencias y sus eventos.
              </p>
            </div>
            <form action={deleteSongWithId} className="shrink-0">
              <SubmitButton
                className="btn btn-danger"
                icon={<Trash2 size={15} />}
                pendingLabel="Eliminando…"
                confirm={`¿Eliminar «${song.title}»? Se borrarán también su plan de lanzamiento, sus royalties, sus referencias y sus eventos. No se puede deshacer.`}
              >
                Eliminar canción
              </SubmitButton>
            </form>
          </div>
        </>
      ),
    },
    {
      id: "colaboradores",
      label: "Colaboradores",
      icon: <Users2 size={15} />,
      content: (
        <div className="card p-6 space-y-6">
          <h2 className="font-semibold flex items-center gap-2">
            <Users2 size={18} /> Featuring y productores
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-neutral-300 mb-2">Featuring</h3>
              <div className="space-y-2 mb-3">
                {song.featurings.map((f) => (
                  <div key={f.id} className="flex items-center justify-between text-sm tile px-3 py-2">
                    <div>
                      <span className="font-medium">{f.artistName}</span>
                      {f.role && <span className="text-neutral-500"> · {f.role}</span>}
                      {f.confirmed && <span className="badge bg-emerald-500/15 text-emerald-300 ml-2">Confirmado</span>}
                    </div>
                    <form action={removeFeaturing.bind(null, song.id, f.id)}>
                      <IconSubmit label="Quitar" className="text-neutral-500 hover:text-red-400">
                        <Trash2 size={14} />
                      </IconSubmit>
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
                <SubmitButton className="btn btn-secondary" pendingLabel="Añadiendo…">Añadir</SubmitButton>
              </form>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-300 mb-2">Productores</h3>
              <div className="space-y-2 mb-3">
                {song.producers.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm tile px-3 py-2">
                    <div>
                      <span className="font-medium">{p.contact.name}</span>
                      {p.role && <span className="text-neutral-500"> · {p.role}</span>}
                    </div>
                    <form action={removeProducer.bind(null, song.id, p.id)}>
                      <IconSubmit label="Quitar" className="text-neutral-500 hover:text-red-400">
                        <Trash2 size={14} />
                      </IconSubmit>
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
                <SubmitButton className="btn btn-secondary" pendingLabel="Añadiendo…">Añadir</SubmitButton>
              </form>
              <p className="text-xs text-neutral-600 mt-2">
                ¿No existe el contacto?{" "}
                <Link href="/contacts" className="text-[var(--accent-soft)] hover:underline">
                  Créalo en Contactos
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "contenido",
      label: "Contenido",
      icon: <Video size={15} />,
      content: (
        <>
          <div className="card p-6 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <MicVocal size={18} /> Letra
            </h2>
            <p className="text-sm text-neutral-500">
              Guárdala una vez y el estudio de clips y el generador de vídeo la
              precargan: no hace falta reescribirla en cada montaje.
            </p>
            <form action={updateSongLyrics.bind(null, song.id)} className="space-y-3">
              <textarea
                name="lyrics"
                rows={6}
                defaultValue={song.lyrics ?? ""}
                placeholder={"Una línea por verso, tal y como quieres que salga en pantalla."}
                className="input font-mono text-sm"
                aria-label="Letra de la canción"
              />
              <SubmitButton className="btn btn-secondary" pendingLabel="Guardando…">
                Guardar letra
              </SubmitButton>
            </form>
          </div>

          <div className="card p-6 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Wand2 size={18} /> Vídeo automático
            </h2>
            <VideoGenerator
              songId={song.id}
              songTitle={song.title}
              songColor={song.color}
              images={song.references.map((r) => ({ url: r.url }))}
              brand={brand}
              initialLyrics={song.lyrics}
            />
          </div>

          <div className="card p-6 space-y-5">
            <h2 className="font-semibold flex items-center gap-2">
              <Scissors size={18} /> Estudio de clips
            </h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <div className="label">Clips de vídeo guardados</div>
                <AssetUploader
                  kind="VIDEO"
                  songId={song.id}
                  label="Subir un clip"
                  enabled={blobOn}
                />
                <AssetList assets={song.assets.filter((a) => a.kind === "VIDEO")} />
              </div>
              <div>
                <div className="label">Audio de la canción</div>
                <AssetUploader
                  kind="AUDIO"
                  songId={song.id}
                  label="Subir el audio"
                  enabled={blobOn}
                />
                <AssetList assets={song.assets.filter((a) => a.kind === "AUDIO")} />
              </div>
            </div>

            <ClipStudio
              songId={song.id}
              songTitle={song.title}
              songColor={song.color}
              videos={videoAssets}
              audios={audioAssets}
              fonts={fontAssets}
              defaultSubtitleStyle={brand.subtitleStyle}
              subtitlePosPct={brand.subtitlePosPct}
              subtitleScale={brand.subtitleScale}
              initialLyrics={song.lyrics}
            />
          </div>

          <div className="card p-6 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Images size={18} /> Referencias visuales
            </h2>
            <p className="text-sm text-neutral-500 -mt-2">
              Sube imágenes para lluvia de ideas: portadas que te inspiran, paletas de color,
              fotogramas de referencia para el vídeo...
            </p>

            {song.references.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {song.references.map((ref) => (
                  <div key={ref.id} className="relative group rounded-lg overflow-hidden tile">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ref.url} alt={ref.caption ?? "Referencia visual"} className="w-full h-32 object-cover" />
                    {ref.caption && (
                      <div className="px-2 py-1.5 text-xs text-neutral-400 truncate">{ref.caption}</div>
                    )}
                    <form action={removeSongReference.bind(null, song.id, ref.id)}>
                      <button
                        type="submit"
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-md bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Eliminar referencia"
                      >
                        <Trash2 size={12} />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
            {song.references.length === 0 && (
              <p className="text-neutral-500 text-sm">Sin imágenes de referencia todavía.</p>
            )}

            {isBlobConfigured() ? (
              <form action={addSongReference.bind(null, song.id)} className="flex flex-wrap gap-2 pt-2" encType="multipart/form-data">
                <input
                  name="file"
                  type="file"
                  accept="image/*"
                  required
                  className="input flex-1 min-w-[10rem] file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:text-neutral-200 file:px-3 file:py-1.5 file:text-xs"
                />
                <input name="caption" placeholder="Descripción breve (opcional)" className="input flex-1 min-w-[10rem]" />
                <SubmitButton className="btn btn-secondary" pendingLabel="Subiendo…">Subir imagen</SubmitButton>
              </form>
            ) : (
              <p className="text-xs text-neutral-600">
                Para subir imágenes, configura Vercel Blob (variable <code>BLOB_READ_WRITE_TOKEN</code>).
              </p>
            )}
          </div>
        </>
      ),
    },
    {
      id: "produccion",
      label: "Producción",
      icon: <ListChecks size={15} />,
      content: (
        <>
          <div className="card p-6 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <ListChecks size={18} /> Gestiones previas / pre-producción
            </h2>
            <div className="space-y-2">
              {song.tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 tile px-3 py-2 text-sm">
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
                      <IconSubmit label="Quitar" className="text-neutral-500 hover:text-red-400">
                        <Trash2 size={14} />
                      </IconSubmit>
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
              <SubmitButton className="btn btn-secondary" pendingLabel="Añadiendo…">Añadir</SubmitButton>
            </form>
          </div>
        </>
      ),
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: <Megaphone size={15} />,
      content: (
        <>
          <SongResults
            songId={song.id}
            snapshots={song.snapshots}
            posts={song.posts}
          />
          {tiktokPlan && (
            <div className="card p-6" style={{ borderColor: "color-mix(in srgb, var(--accent-magenta) 30%, transparent)" }}>
              <h2 className="font-semibold flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-[var(--accent-soft)]" /> Plan de TikTok
              </h2>
              <p className="text-sm text-neutral-400 mb-3">
                A {formatDateApprox(song.releaseDate)} le quedan{" "}
                <strong className="text-neutral-200">{days} {days === 1 ? "día" : "días"}</strong>.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="badge bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--accent-soft)] text-sm py-1 px-3">
                  {tiktokPlan.cadence}
                </span>
              </div>
              <p className="text-sm text-neutral-400 mt-3">{tiktokPlan.focus}</p>
            </div>
          )}

          <div className="card p-6">
            {song.launchTasks.length === 0 ? (
              <div className="text-center py-6">
                <h2 className="display text-2xl mb-2">Acompañamiento de lanzamiento</h2>
                <p className="text-sm text-neutral-400 max-w-lg mx-auto mb-5">
                  {LAUNCH_STEPS.length} pasos repartidos en {PHASES.length} fases, desde
                  aprobar el máster hasta el balance del mes siguiente. Cada uno con su
                  fecha calculada a partir de la fecha aproximada de la canción.
                </p>
                <form action={generateLaunchPlanWithId}>
                  <SubmitButton icon={<Wand2 size={15} />} pendingLabel="Creando el plan…">
                    Crear el plan
                  </SubmitButton>
                </form>
                {!song.releaseDate && (
                  <p className="text-xs text-amber-300/80 mt-4">
                    Sin fecha aproximada los pasos se crean sin fechas concretas.
                    Ponle una en Info y vuelve a sincronizar.
                  </p>
                )}
              </div>
            ) : (
              <>
                <LaunchPlan
                  songId={song.id}
                  tasks={song.launchTasks}
                  daysToRelease={days}
                />
                {song.launchTasks.length < LAUNCH_STEPS.length && (
                  <p className="text-xs text-neutral-500 mt-5">
                    Faltan {LAUNCH_STEPS.length - song.launchTasks.length} pasos del
                    playbook. Puede ser porque su fecha ya había pasado cuando creaste
                    el plan —el plan arranca donde estás de verdad, no donde deberías
                    haber empezado— o porque son pasos añadidos después. Con «Añadir
                    pasos que falten» se incorporan los que aún tengan sentido.
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-white/[0.09]">
                  <form action={resyncLaunchPlanWithId}>
                    <SubmitButton className="btn btn-secondary" pendingLabel="Recalculando…">
                      Recalcular fechas
                    </SubmitButton>
                  </form>
                  <form action={generateLaunchPlanWithId}>
                    <SubmitButton className="btn btn-secondary" pendingLabel="Añadiendo…">
                      Añadir pasos que falten
                    </SubmitButton>
                  </form>
                </div>
              </>
            )}
          </div>

        </>
      ),
    },
  ];

  return (
    <div
      className="space-y-6 pb-16"
      style={{ "--song": song.color } as React.CSSProperties}
    >
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* El bloom de cabecera respira en el color de la canción: cada
            ficha tiene su propia luz, no la genérica de la marca. */}
        <div
          aria-hidden
          className="absolute -inset-x-8 -top-10 h-44 pointer-events-none -z-10"
          style={{
            background: `radial-gradient(60% 100% at 18% 0%, color-mix(in srgb, ${song.color} 20%, transparent), transparent 70%)`,
            filter: "blur(22px)",
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <ColorDot color={song.color} />
            <span className="eyebrow">Ficha de canción</span>
          </div>
          <h1 className="display-title text-4xl sm:text-5xl break-words">{song.title}</h1>
          <div className="flex items-center gap-2 mt-3">
            <StageBadge stage={song.stage} />
            {song.genre && <span className="text-sm text-neutral-500">{song.genre}</span>}
          </div>
        </div>
      </div>

      <SongWorkspace tabs={tabs} nextStep={nextStep} initialTab={resolveTab(tab, tabs)} />
    </div>
  );
}

/* "distribucion" y "royalties" llegan de las páginas globales; la primera
   vive dentro de la pestaña de Producción. */
function resolveTab(tab: string | undefined, tabs: { id: string }[]) {
  if (!tab) return undefined;
  const target = tab === "distribucion" ? "produccion" : tab;
  return tabs.some((t) => t.id === target) ? target : undefined;
}
