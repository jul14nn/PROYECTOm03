import Link from "next/link";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/constants";
import type { Campaign } from "@/lib/campaignSpan";

type Strip = Campaign & { stageIndex: number };

/**
 * Mesa de mezclas: un canal por canción.
 *
 * El fader marca por dónde va la producción (de Idea a Lanzada) y el vúmetro
 * de al lado, cuánto llevas del plan de campaña. Un productor lee una mesa de
 * un vistazo sin que nadie le explique nada, y aquí las dos magnitudes que de
 * verdad importan son justo dos alturas comparables entre canales.
 */
export default function Consola({ campaigns }: { campaigns: Campaign[] }) {
  const strips: Strip[] = campaigns.map((c) => ({
    ...c,
    stageIndex: Math.max(0, STAGES.indexOf(c.stage as Stage)),
  }));

  if (strips.length === 0) {
    return <p className="text-neutral-500 text-sm">Sin canciones con fecha.</p>;
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3" style={{ minWidth: "min-content" }}>
        {strips.map((s) => {
          const stagePct = (s.stageIndex / (STAGES.length - 1)) * 100;
          const planPct = s.total > 0 ? (s.done / s.total) * 100 : 0;
          const urgent = s.releaseIn >= 0 && s.releaseIn <= 7;

          return (
            <Link
              key={s.songId}
              href={`/songs/${s.songId}`}
              className="shrink-0 w-[9.5rem] rounded-xl p-3 flex flex-col transition-colors"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.015))",
                border: `1px solid ${urgent ? "color-mix(in srgb, var(--accent-magenta) 45%, transparent)" : "var(--edge)"}`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Piloto del canal */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}` }}
                />
                <span className="text-xs font-medium truncate">{s.title}</span>
              </div>

              {/* Cuenta atrás, como el display del canal */}
              <div
                className="rounded-md px-2 py-1.5 mb-3 text-center"
                style={{ background: "rgba(0,0,0,0.4)", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.6)" }}
              >
                <div
                  className={`numeral text-xl leading-none ${urgent ? "text-fuchsia-300" : "text-neutral-300"}`}
                >
                  {s.releaseIn < 0 ? "fuera" : s.releaseIn === 0 ? "hoy" : s.releaseIn}
                </div>
                <div className="text-[0.55rem] uppercase tracking-wider text-neutral-600 mt-0.5">
                  {s.releaseIn > 0 ? "días" : " "}
                </div>
              </div>

              <div className="flex gap-3 flex-1">
                {/* Fader: etapa de producción */}
                <div className="flex-1 flex flex-col items-center">
                  <div
                    className="relative w-1.5 rounded-full flex-1 min-h-[7rem]"
                    style={{ background: "rgba(0,0,0,0.5)", boxShadow: "inset 0 0 3px rgba(0,0,0,0.8)" }}
                  >
                    {/* Muescas de cada etapa */}
                    {STAGES.map((_, i) => (
                      <span
                        key={i}
                        className="absolute -left-1 w-3.5 h-px"
                        style={{
                          bottom: `${(i / (STAGES.length - 1)) * 100}%`,
                          background: "rgba(255,255,255,0.08)",
                        }}
                      />
                    ))}
                    {/* Puño del fader */}
                    <span
                      className="absolute -left-[7px] w-[1.15rem] h-3 rounded-sm"
                      style={{
                        bottom: `calc(${stagePct}% - 6px)`,
                        background: "linear-gradient(180deg,#4a4753,#232028)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.6)",
                      }}
                    />
                  </div>
                  <span className="text-[0.5rem] uppercase tracking-wider text-neutral-600 mt-2">
                    etapa
                  </span>
                </div>

                {/* Vúmetro: avance del plan */}
                <div className="flex-1 flex flex-col items-center">
                  <div
                    className="relative w-3.5 rounded-sm flex-1 min-h-[7rem] overflow-hidden"
                    style={{ background: "rgba(0,0,0,0.5)", boxShadow: "inset 0 0 3px rgba(0,0,0,0.8)" }}
                  >
                    <div
                      className="absolute inset-x-0 bottom-0"
                      style={{
                        height: `${planPct}%`,
                        background:
                          "linear-gradient(0deg, #34d399 0%, #34d399 55%, #fbbf24 80%, #f87171 100%)",
                      }}
                    />
                    {/* Segmentación de LED */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(0deg, transparent 0 4px, rgba(0,0,0,0.55) 4px 6px)",
                      }}
                    />
                  </div>
                  <span className="text-[0.5rem] uppercase tracking-wider text-neutral-600 mt-2">
                    plan
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 text-center" style={{ borderTop: "1px solid var(--edge)" }}>
                <div className="text-[0.6rem] text-neutral-400 truncate">
                  {STAGE_LABELS[STAGES[s.stageIndex]]}
                </div>
                <div className="text-[0.6rem] text-neutral-600 tabular-nums">
                  {s.total > 0 ? `${s.done}/${s.total} pasos` : "sin plan"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
