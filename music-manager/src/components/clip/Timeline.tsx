"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SubtitleLine } from "@/lib/subtitleStyles";

/**
 * Línea de tiempo del estudio de clips.
 *
 * Es la pieza que convierte esto en un editor y no en un formulario: se ve el
 * vídeo entero en miniaturas, se arrastra el trozo que quieres y los
 * subtítulos aparecen donde caen de verdad.
 *
 * Todo se mide en segundos absolutos del vídeo de origen; el recorte es un
 * intervalo dentro de él.
 */

export function tiempo(s: number) {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toFixed(1).padStart(4, "0")}`;
}

export default function Timeline({
  duration,
  start,
  length,
  playhead,
  thumbs,
  lines,
  audioName,
  color,
  onTrim,
  onSeek,
}: {
  duration: number;
  start: number;
  length: number;
  playhead: number;
  thumbs: string[];
  lines: SubtitleLine[];
  audioName: string | null;
  color: string;
  onTrim: (start: number, length: number) => void;
  onSeek: (t: number) => void;
}) {
  const pistaRef = useRef<HTMLDivElement>(null);
  const arrastre = useRef<"inicio" | "fin" | "cabeza" | null>(null);

  const pct = useCallback((t: number) => (duration ? (t / duration) * 100 : 0), [duration]);

  /** Convierte una posición del ratón en segundos del vídeo. */
  const tiempoEn = useCallback(
    (clientX: number) => {
      const caja = pistaRef.current?.getBoundingClientRect();
      if (!caja || !duration) return 0;
      const r = (clientX - caja.left) / caja.width;
      return Math.max(0, Math.min(duration, r * duration));
    },
    [duration]
  );

  // El arrastre se escucha en la ventana: si el ratón se sale de la pista,
  // el gesto continúa en vez de cortarse a mitad.
  useEffect(() => {
    function mover(e: PointerEvent) {
      if (!arrastre.current) return;
      const t = tiempoEn(e.clientX);
      if (arrastre.current === "cabeza") {
        onSeek(t);
      } else if (arrastre.current === "inicio") {
        // Mover el inicio no mueve el final: se acorta el trozo.
        const fin = start + length;
        const nuevo = Math.max(0, Math.min(t, fin - 1));
        onTrim(nuevo, +(fin - nuevo).toFixed(2));
      } else {
        const nuevaLong = Math.max(1, Math.min(duration - start, t - start));
        onTrim(start, +nuevaLong.toFixed(2));
      }
    }
    function soltar() {
      arrastre.current = null;
      document.body.style.cursor = "";
    }
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
  }, [duration, start, length, onTrim, onSeek, tiempoEn]);

  // El manejador se llama al pulsar, no al renderizar: crear la función
  // durante el render y que esta escriba en la ref es justo lo que avisa
  // react-hooks/refs.
  const agarrar = useCallback(
    (e: React.PointerEvent, cual: "inicio" | "fin" | "cabeza") => {
      e.preventDefault();
      e.stopPropagation();
      arrastre.current = cual;
      document.body.style.cursor = cual === "cabeza" ? "grabbing" : "ew-resize";
    },
    []
  );

  if (!duration) return null;

  const paso = duration <= 30 ? 5 : duration <= 120 ? 10 : 30;
  const marcas: number[] = [];
  for (let t = 0; t <= duration; t += paso) marcas.push(t);

  return (
    <div className="select-none" style={{ ["--song" as string]: color }}>
      <div className="relative h-4 mb-1">
        {marcas.map((t) => (
          <span
            key={t}
            className="absolute top-0 text-[0.6rem] text-neutral-600 -translate-x-1/2"
            style={{ left: `${pct(t)}%` }}
          >
            {tiempo(t)}
          </span>
        ))}
      </div>

      <div
        ref={pistaRef}
        className="relative rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--edge)" }}
        onPointerDown={(e) => {
          if (arrastre.current) return;
          onSeek(tiempoEn(e.clientX));
        }}
      >
        <div className="flex h-14 bg-black/50">
          {thumbs.length > 0 ? (
            thumbs.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                draggable={false}
                className="h-full flex-1 object-cover min-w-0"
              />
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-neutral-600">
              vídeo
            </div>
          )}
        </div>

        {audioName && (
          <div
            className="h-7 flex items-center px-2 text-[0.65rem] text-neutral-300 truncate"
            style={{
              borderTop: "1px solid var(--edge)",
              background: "color-mix(in srgb, var(--song) 20%, rgba(0,0,0,0.55))",
            }}
          >
            ♪ {audioName}
          </div>
        )}

        <div className="relative h-7 bg-black/40" style={{ borderTop: "1px solid var(--edge)" }}>
          {lines.map((l, i) => (
            <div
              key={i}
              title={l.text}
              className="absolute top-1 bottom-1 rounded px-1.5 flex items-center text-[0.62rem] text-white/90 overflow-hidden whitespace-nowrap"
              style={{
                left: `${pct(start + l.start)}%`,
                width: `${Math.max(pct(l.end - l.start), 1)}%`,
                background: "color-mix(in srgb, var(--song) 55%, transparent)",
                border: "1px solid color-mix(in srgb, var(--song) 85%, transparent)",
              }}
            >
              {l.text}
            </div>
          ))}
          {lines.length === 0 && (
            <span className="absolute left-2 top-1.5 text-[0.62rem] text-neutral-600">
              sin subtítulos
            </span>
          )}
        </div>

        {/* Lo que queda fuera del recorte se apaga */}
        <div
          className="absolute inset-y-0 left-0 bg-black/65 pointer-events-none"
          style={{ width: `${pct(start)}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-black/65 pointer-events-none"
          style={{ width: `${100 - pct(start + length)}%` }}
        />
        <div
          className="absolute inset-y-0 pointer-events-none"
          style={{
            left: `${pct(start)}%`,
            width: `${pct(length)}%`,
            border: "2px solid var(--song)",
            borderRadius: "0.35rem",
          }}
        />

        <Tirador lado="izq" left={pct(start)} onPointerDown={(e) => agarrar(e, "inicio")} />
        <Tirador lado="der" left={pct(start + length)} onPointerDown={(e) => agarrar(e, "fin")} />

        <div
          className="absolute inset-y-0 w-[2px] bg-white pointer-events-none"
          style={{ left: `${pct(playhead)}%`, boxShadow: "0 0 6px rgba(255,255,255,0.8)" }}
        />
        <div
          onPointerDown={(e) => agarrar(e, "cabeza")}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") onSeek(Math.max(0, playhead - 0.5));
            if (e.key === "ArrowRight") onSeek(Math.min(duration, playhead + 0.5));
          }}
          className="absolute top-0 w-3 h-3 rounded-sm bg-white cursor-grab -translate-x-1/2 rotate-45"
          style={{ left: `${pct(playhead)}%` }}
          role="slider"
          aria-label="Posición de reproducción"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(playhead)}
          tabIndex={0}
        />
      </div>

      <div className="flex justify-between text-[0.65rem] text-neutral-500 mt-1.5">
        <span>
          Trozo: {tiempo(start)} → {tiempo(start + length)}
        </span>
        <span className="numeral">{length.toFixed(1)}s</span>
      </div>
    </div>
  );
}

function Tirador({
  lado,
  left,
  onPointerDown,
}: {
  lado: "izq" | "der";
  left: number;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      className="absolute inset-y-0 w-3 cursor-ew-resize flex items-center justify-center z-10"
      style={{
        left: `${left}%`,
        // Los tiradores van DENTRO de la región elegida. Puestos por fuera,
        // el de inicio queda cortado por el `overflow-hidden` cuando el
        // recorte empieza en 0 y no hay forma de agarrarlo.
        transform: lado === "der" ? "translateX(-100%)" : "none",
        background: "var(--song)",
      }}
      aria-label={lado === "izq" ? "Inicio del trozo" : "Final del trozo"}
      role="separator"
    >
      <span className="w-[2px] h-4 bg-black/40 rounded" />
    </div>
  );
}
