"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { StageBadge, ColorDot } from "@/components/Badges";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/constants";
import { ImageOff, Users2, Search, X, List, LayoutGrid } from "lucide-react";
import Fundas, { type SleeveItem } from "@/components/catalog/Fundas";
import Waveform from "@/components/Waveform";

export type SongRow = {
  id: string;
  title: string;
  genre: string | null;
  color: string;
  stage: string;
  needsCover: boolean;
  coverUrl: string | null;
  releaseLabel: string;
  daysToRelease: number | null;
  featurings: string[];
  producers: string[];
};

export default function SongsBrowser({ songs }: { songs: SongRow[] }) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<Stage | "ALL">("ALL");
  const [view, setView] = useState<"lista" | "fundas">("lista");

  // Solo se ofrecen como filtro las etapas que realmente tienen canciones,
  // para no llenar la pantalla de botones que no llevan a ninguna parte.
  const availableStages = useMemo(
    () => STAGES.filter((s) => songs.some((song) => song.stage === s)),
    [songs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs.filter((song) => {
      if (stage !== "ALL" && song.stage !== stage) return false;
      if (!q) return true;
      const haystack = [
        song.title,
        song.genre ?? "",
        ...song.featurings,
        ...song.producers,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [songs, query, stage]);

  /* La canción que manda ahora: la del lanzamiento más cercano por delante.
     Rompe la rejilla uniforme — una grande con su color y su onda, el resto
     en lista. Solo sin filtros: al buscar, la lista plana es más útil. */
  const featured = useMemo(() => {
    if (query.trim() !== "" || stage !== "ALL" || songs.length < 2) return null;
    const upcoming = songs
      .filter((s) => s.daysToRelease !== null && s.daysToRelease >= 0)
      .sort((a, b) => a.daysToRelease! - b.daysToRelease!);
    return upcoming[0] ?? null;
  }, [songs, query, stage]);

  const listed = featured ? filtered.filter((s) => s.id !== featured.id) : filtered;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título, tipo, featuring o productor…"
          className="input"
          // .input define `padding` en shorthand, así que las utilidades
          // pl-*/pr-* de Tailwind no ganan; se fuerza en línea.
          style={{ paddingLeft: "2.25rem", paddingRight: "2.25rem" }}
          aria-label="Buscar canciones"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {availableStages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 flex-1 min-w-0">
            <FilterChip active={stage === "ALL"} onClick={() => setStage("ALL")}>
              Todas ({songs.length})
            </FilterChip>
            {availableStages.map((s) => (
              <FilterChip key={s} active={stage === s} onClick={() => setStage(s)}>
                {STAGE_LABELS[s]} ({songs.filter((song) => song.stage === s).length})
              </FilterChip>
            ))}
          </div>
        )}
        <div
          className="flex shrink-0 rounded-lg overflow-hidden ml-auto"
          style={{ border: "1px solid var(--edge)" }}
        >
          <ViewButton active={view === "lista"} onClick={() => setView("lista")} label="Ver en lista">
            <List size={15} />
          </ViewButton>
          <ViewButton active={view === "fundas"} onClick={() => setView("fundas")} label="Ver como fundas">
            <LayoutGrid size={15} />
          </ViewButton>
        </div>
      </div>

      {view === "fundas" ? (
        <Fundas
          items={filtered.map<SleeveItem>((song) => ({
            id: song.id,
            title: song.title,
            color: song.color,
            stageLabel: STAGE_LABELS[song.stage as Stage] ?? song.stage,
            needsCover: song.needsCover,
            coverUrl: song.coverUrl,
            releaseLabel: song.releaseLabel,
            daysToRelease: song.daysToRelease,
          }))}
        />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          Ninguna canción coincide con la búsqueda.
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {featured && <FeaturedSong song={featured} />}
          <div className="card divide-y divide-white/[0.06] overflow-hidden">
          {listed.map((song) => (
            <Link
              key={song.id}
              href={`/songs/${song.id}`}
              className="song-row flex items-center gap-4 px-5 py-4"
              style={{ "--song": song.color } as React.CSSProperties}
            >
              <ColorDot color={song.color} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{song.title}</span>
                  {song.needsCover && (
                    <span title="Falta portada">
                      <ImageOff size={14} className="text-[var(--accent-soft)] shrink-0" />
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2 flex-wrap">
                  {song.genre && <span>{song.genre}</span>}
                  {song.featurings.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users2 size={12} />
                      {song.featurings.join(", ")}
                    </span>
                  )}
                  {song.producers.length > 0 && (
                    <span>Prod: {song.producers.join(", ")}</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-neutral-500 hidden sm:block">
                {song.releaseLabel}
              </div>
              <StageBadge stage={song.stage} />
            </Link>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeaturedSong({ song }: { song: SongRow }) {
  const days = song.daysToRelease;
  return (
    <Link
      href={`/songs/${song.id}`}
      className="card song-tint block p-6 sm:p-7 relative overflow-hidden group"
      style={{ "--song": song.color } as React.CSSProperties}
    >
      {/* La onda es la firma de la canción: siempre la misma para la misma id. */}
      <Waveform
        seed={song.id}
        color={song.color}
        className="absolute inset-x-0 bottom-0 h-14 w-full pointer-events-none"
        opacity={0.3}
        /* Fundido hacia arriba para que el texto no pise barras a plena luz. */
        style={{
          maskImage: "linear-gradient(180deg, transparent, black 70%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent, black 70%)",
        }}
      />
      <div className="relative flex items-start justify-between gap-4 flex-wrap pb-8">
        <div className="min-w-0">
          <div className="eyebrow mb-2" style={{ color: "color-mix(in srgb, var(--song) 70%, white)" }}>
            Próximo lanzamiento
          </div>
          <div className="display text-4xl sm:text-5xl text-white">{song.title}</div>
          <div className="text-sm text-neutral-400 mt-2 flex items-center gap-3 flex-wrap">
            {song.genre && <span>{song.genre}</span>}
            {song.featurings.length > 0 && <span>con {song.featurings.join(", ")}</span>}
            <span>{song.releaseLabel}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          {days !== null && (
            <>
              <div className="numeral text-5xl text-white leading-none">{days}</div>
              <div className="text-xs text-neutral-500 mt-1">{days === 1 ? "día" : "días"}</div>
            </>
          )}
          <div className="mt-2">
            <StageBadge stage={song.stage} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={clsx(
        "px-2.5 py-2 transition-colors",
        active ? "text-white bg-white/[0.09]" : "text-neutral-500 hover:text-neutral-200"
      )}
    >
      {children}
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "text-white"
          : "bg-white/[0.04] text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.075] border border-white/[0.07]"
      )}
      style={
        active
          ? {
              background: "linear-gradient(135deg, var(--accent-violet), var(--accent-magenta))",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.28), 0 4px 14px -6px color-mix(in srgb, var(--accent-magenta) 80%, transparent)",
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}
