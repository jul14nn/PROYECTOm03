"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { Captions, Timer } from "lucide-react";
import {
  SUBTITLE_STYLES,
  autoTime,
  type SubtitleLine,
  type SubtitleStyleId,
} from "@/lib/subtitleStyles";

/**
 * Editor de subtítulos compartido por el generador de vídeo y el estudio de
 * clips. Dos formas de cuadrar tiempos: repartir por duración, o marcar al
 * ritmo pulsando mientras suena, que es lo que de verdad usa alguien que ya
 * se sabe la canción.
 */
export default function SubtitleEditor({
  duration,
  lines,
  setLines,
  style,
  setStyle,
  defaultOpen = false,
  initialText,
}: {
  duration: number;
  lines: SubtitleLine[];
  setLines: (l: SubtitleLine[]) => void;
  style: SubtitleStyleId;
  setStyle: (s: SubtitleStyleId) => void;
  defaultOpen?: boolean;
  initialText?: string | null;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [raw, setRaw] = useState(initialText ?? "");
  const [syncing, setSyncing] = useState(false);
  const [syncIndex, setSyncIndex] = useState(0);
  const syncStart = useRef(0);
  const marks = useRef<number[]>([]);

  const texts = raw.split("\n").map((l) => l.trim()).filter(Boolean);

  function startSync() {
    if (texts.length === 0) return;
    marks.current = [];
    setSyncIndex(0);
    setSyncing(true);
    syncStart.current = performance.now();
  }

  function mark() {
    marks.current.push((performance.now() - syncStart.current) / 1000);
    const next = syncIndex + 1;
    if (next >= texts.length) {
      const m = marks.current;
      setLines(
        texts.map((text, i) => ({
          text,
          start: +m[i].toFixed(2),
          // La última línea aguanta hasta el final del vídeo.
          end: +(i + 1 < m.length ? m[i + 1] : duration).toFixed(2),
        }))
      );
      setSyncing(false);
    } else {
      setSyncIndex(next);
    }
  }

  return (
    <div className="tile p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 text-sm font-medium w-full text-left"
      >
        <Captions size={16} className="text-[var(--accent-soft)]" />
        Subtítulos
        <span className="text-xs text-neutral-500 font-normal ml-auto">
          {lines.length > 0 ? `${lines.length} líneas` : "sin subtítulos"}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="sub-lines">
              Una línea por verso
            </label>
            <textarea
              id="sub-lines"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={4}
              placeholder={"Y las noches de neón\nse apagan sin ti"}
              className="input font-mono text-sm"
            />
          </div>

          <div>
            <div className="label">Estilo</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {SUBTITLE_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={clsx(
                    "text-left rounded-lg p-2.5 border transition-colors",
                    style === s.id
                      ? "border-[color-mix(in_srgb,var(--accent)_60%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                      : "border-white/[0.07] hover:bg-white/[0.04]"
                  )}
                >
                  <div className="text-sm">{s.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{s.description}</div>
                </button>
              ))}
            </div>
          </div>

          {syncing ? (
            <div className="rounded-lg p-4 border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]">
              <p className="text-xs text-neutral-400 mb-2">
                Línea {syncIndex + 1} de {texts.length} — pulsa cuando deba aparecer
              </p>
              <p className="text-lg mb-3">{texts[syncIndex]}</p>
              <button type="button" onClick={mark} className="btn btn-primary w-full">
                Marcar ahora
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLines(autoTime(texts, duration))}
                disabled={texts.length === 0}
                className="btn btn-secondary"
              >
                Repartir en {duration}s
              </button>
              <button
                type="button"
                onClick={startSync}
                disabled={texts.length === 0}
                className="btn btn-secondary"
              >
                <Timer size={14} /> Sincronizar al ritmo
              </button>
              {lines.length > 0 && (
                <button type="button" onClick={() => setLines([])} className="btn btn-danger">
                  Quitar
                </button>
              )}
            </div>
          )}

          {lines.length > 0 && !syncing && (
            <ul className="text-xs text-neutral-500 space-y-1 font-mono">
              {lines.map((l, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-neutral-600 tabular-nums w-24 shrink-0">
                    {l.start.toFixed(1)}s → {l.end.toFixed(1)}s
                  </span>
                  <span className="truncate text-neutral-400">{l.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
