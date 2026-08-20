import Link from "next/link";
import { STAGE_LABELS, formatDate, type Stage } from "@/lib/constants";
import type { Campaign } from "@/lib/campaignSpan";
import Sleeve from "@/components/lab/Sleeve";

/**
 * El catálogo como estantería: cada canción es una funda de disco.
 *
 * La idea que lo justifica: la portada que falta NO se representa con un aviso
 * de texto, sino con una funda en blanco. El hueco es el recordatorio, y una
 * estantería con fundas vacías incomoda mucho más que un contador que dice
 * "1 sin portada".
 */
export default function Archivo({ campaigns }: { campaigns: Campaign[] }) {
  if (campaigns.length === 0) {
    return <p className="text-neutral-500 text-sm">Sin canciones con fecha.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {campaigns.map((c) => {
        return (
          <Link key={c.songId} href={`/songs/${c.songId}`} className="group block">
            <div
              className="relative aspect-square rounded-sm overflow-hidden transition-transform duration-300 group-hover:-translate-y-1.5"
              style={{
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.6), 0 18px 34px -18px rgba(0,0,0,0.95)",
              }}
            >
              <Sleeve coverUrl={c.coverUrl} title={c.title} missing={c.needsCover} />

              {/* Brillo del plástico, que es lo que le da cuerpo de objeto */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(115deg, rgba(255,255,255,0.22) 0%, transparent 28%, transparent 72%, rgba(255,255,255,0.08) 100%)",
                }}
              />

              {/* Canto lateral, como el lomo de la funda */}
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 w-[6px]"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(0,0,0,0.55), rgba(255,255,255,0.06) 60%, transparent)",
                }}
              />

              {/* Pegatina de cuenta atrás, como las de tienda de discos */}
              {c.releaseIn >= 0 && c.releaseIn <= 30 && (
                <span
                  className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider"
                  style={{
                    background: c.releaseIn <= 7 ? "var(--accent-magenta)" : "var(--accent-amber)",
                    color: c.releaseIn <= 7 ? "white" : "#241a00",
                    transform: "rotate(4deg)",
                  }}
                >
                  {c.releaseIn === 0 ? "hoy" : `${c.releaseIn} días`}
                </span>
              )}
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-sm truncate group-hover:text-white transition-colors">
                  {c.title}
                </span>
              </div>
              <div className="text-[0.68rem] text-neutral-500 mt-1 flex flex-wrap gap-x-2">
                <span>{STAGE_LABELS[c.stage as Stage] ?? c.stage}</span>
                <span className="text-neutral-700">·</span>
                <span className="tabular-nums">
                  ~ {formatDate(c.releaseDate)}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
