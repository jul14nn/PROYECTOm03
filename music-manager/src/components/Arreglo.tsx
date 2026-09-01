import Link from "next/link";
import { phaseBlocks, type Campaign } from "@/lib/campaignSpan";
import { AlertTriangle } from "lucide-react";

/** Intensidad visual de cada fase: el bloque pesa lo que pesa el trabajo. */
const PHASE_TONE: Record<string, { bg: string; label: string }> = {
  FUNDAMENTOS: { bg: "rgba(255,255,255,0.07)", label: "Fundamentos" },
  ACTIVOS: { bg: "rgba(255,255,255,0.13)", label: "Activos" },
  CALENTAMIENTO: { bg: "color-mix(in srgb, var(--accent-violet) 42%, transparent)", label: "Calentamiento" },
  CUENTA_ATRAS: { bg: "color-mix(in srgb, var(--accent-magenta) 65%, transparent)", label: "Cuenta atrás" },
  SALIDA: { bg: "var(--accent-amber)", label: "" },
  SOSTENER: { bg: "color-mix(in srgb, var(--accent-violet) 22%, transparent)", label: "Sostener" },
};

const DAY_PX = 4.2;
const LANE_H = 56;
const GUTTER = 150;

/** Une nombres en lenguaje natural: "A, B y C". */
function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return names.slice(0, -1).join(", ") + " y " + names[names.length - 1];
}

/**
 * Vista de arreglo, como la ventana de arreglo de un DAW: el tiempo corre en
 * horizontal, cada canción es una pista y cada fase de campaña es un clip.
 *
 * Los nombres van en una columna fija a la izquierda, como las cabeceras de
 * pista de cualquier secuenciador: si flotan sobre los clips se montan encima
 * y no se lee ni una cosa ni la otra.
 *
 * No es decoración: es la única vista que responde a "¿se me solapan dos
 * lanzamientos?", invisible en una lista ordenada por fecha.
 */
export default function Arreglo({ campaigns }: { campaigns: Campaign[] }) {
  if (campaigns.length === 0) {
    return (
      <p className="text-neutral-500 text-sm">
        Ninguna canción tiene fecha aproximada, así que no hay nada que colocar
        en el tiempo.
      </p>
    );
  }

  const from = Math.min(-14, ...campaigns.map((c) => c.from)) - 3;
  const to = Math.max(14, ...campaigns.map((c) => c.to)) + 3;
  const width = (to - from) * DAY_PX;
  const x = (day: number) => (day - from) * DAY_PX;

  // Marcas cada dos semanas: cada semana se amontona y no se lee.
  const marks: number[] = [];
  for (let d = Math.ceil(from / 14) * 14; d <= to; d += 14) marks.push(d);

  const colliding = campaigns.filter((c) => c.collidesWith.length > 0);

  return (
    <div className="space-y-5">
      {colliding.length > 0 && (
        <div
          className="flex items-start gap-3 rounded-xl p-4"
          style={{
            background: "color-mix(in srgb, #f59e0b 12%, transparent)",
            border: "1px solid color-mix(in srgb, #f59e0b 32%, transparent)",
          }}
        >
          <AlertTriangle size={18} className="text-amber-300 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-amber-200 font-medium">
              {colliding.length} campañas se pisan en su semana fuerte
            </p>
            <p className="text-neutral-400 mt-1 max-w-2xl">
              {joinNames(colliding.map((c) => c.title))} tienen la cuenta atrás
              solapada. Dos lanzamientos a la vez se roban audiencia entre ellos:
              o separas las fechas, o decides cuál lleva el peso.
            </p>
          </div>
        </div>
      )}

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--edge)", background: "rgba(0,0,0,0.25)" }}
      >
        <div className="flex">
          {/* ------------------------------------- Cabeceras de pista (fijas) */}
          <div
            className="shrink-0"
            style={{ width: GUTTER, borderRight: "1px solid var(--edge-strong)" }}
          >
            <div
              className="h-8 flex items-end px-3 pb-1"
              style={{ borderBottom: "1px solid var(--edge)" }}
            >
              <span className="text-[0.55rem] uppercase tracking-[0.15em] text-neutral-600">
                Pistas
              </span>
            </div>
            {campaigns.map((c) => (
              <Link
                key={c.songId}
                href={`/songs/${c.songId}`}
                className="flex items-center gap-2 px-3 hover:bg-white/[0.04] transition-colors"
                style={{ height: LANE_H, borderBottom: "1px solid var(--edge)" }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.color, boxShadow: `0 0 6px ${c.color}` }}
                />
                <span className="min-w-0">
                  <span className="block text-[0.8rem] leading-tight truncate">{c.title}</span>
                  <span className="block text-[0.6rem] text-neutral-600 tabular-nums">
                    {c.releaseIn < 0 ? "fuera" : c.releaseIn === 0 ? "hoy" : `${c.releaseIn} d`}
                  </span>
                </span>
                {c.collidesWith.length > 0 && (
                  <AlertTriangle size={12} className="text-amber-300 shrink-0 ml-auto" />
                )}
              </Link>
            ))}
          </div>

          {/* ------------------------------------------- Arreglo (con scroll) */}
          <div className="overflow-x-auto flex-1">
            <div style={{ width, minWidth: "100%" }}>
              <div
                className="relative h-8"
                style={{ borderBottom: "1px solid var(--edge)" }}
              >
                {marks.map((d) => (
                  <div key={d} className="absolute bottom-1" style={{ left: x(d) }}>
                    <span className="block text-[0.55rem] tabular-nums text-neutral-600 -translate-x-1/2 whitespace-nowrap">
                      {d === 0 ? "" : `${d > 0 ? "+" : "−"}${Math.abs(d / 7)} sem`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative" style={{ height: campaigns.length * LANE_H }}>
                {/* Rejilla de fondo cada dos semanas */}
                {marks.map((d) => (
                  <div
                    key={d}
                    className="absolute top-0 bottom-0 w-px"
                    style={{ left: x(d), background: "rgba(255,255,255,0.045)" }}
                  />
                ))}

                {/* Cabezal de reproducción: hoy */}
                <div
                  className="absolute top-0 bottom-0 w-px z-20"
                  style={{
                    left: x(0),
                    background: "var(--accent-amber)",
                    boxShadow: "0 0 12px var(--accent-amber)",
                  }}
                >
                  <span
                    className="absolute -top-[1.4rem] -translate-x-1/2 text-[0.55rem] uppercase tracking-wider px-1.5 rounded-sm"
                    style={{ background: "var(--accent-amber)", color: "#1a1200" }}
                  >
                    hoy
                  </span>
                </div>

                {campaigns.map((c, i) => (
                  <div
                    key={c.songId}
                    className="absolute inset-x-0"
                    style={{
                      top: i * LANE_H,
                      height: LANE_H,
                      borderBottom: "1px solid var(--edge)",
                    }}
                  >
                    {phaseBlocks(c).map((p) => {
                      const tone = PHASE_TONE[p.id];
                      const w = Math.max(DAY_PX * 2, (p.to - p.from + 1) * DAY_PX);
                      // La etiqueta solo cabe si el clip es ancho de verdad.
                      const showLabel = tone.label && w > tone.label.length * 6.2;
                      return (
                        <div
                          key={p.id}
                          title={`${c.title} · ${p.name}`}
                          className="absolute top-[9px] h-[38px] rounded-[3px] flex items-center px-2 overflow-hidden"
                          style={{ left: x(p.from), width: w, background: tone.bg }}
                        >
                          {showLabel && (
                            <span className="text-[0.56rem] uppercase tracking-wider text-white/80 whitespace-nowrap">
                              {tone.label}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* Marca del lanzamiento */}
                    <div
                      className="absolute top-[6px] h-11 w-[3px] z-10 rounded-full"
                      style={{
                        left: x(c.releaseIn),
                        background: c.color,
                        boxShadow: `0 0 10px ${c.color}`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[0.65rem] text-neutral-500">
        {Object.entries(PHASE_TONE).map(([id, t]) => (
          <span key={id} className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm" style={{ background: t.bg }} />
            {t.label || "Salida"}
          </span>
        ))}
      </div>
    </div>
  );
}
