"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { signOutAction } from "@/lib/actions/auth";
import { LogOut, Settings2 } from "lucide-react";
import clsx from "clsx";

export default function Sidebar({
  userName,
  userEmail,
  rail = false,
}: {
  userName?: string | null;
  userEmail?: string | null;
  /** Modo raíl: solo iconos, se despliega al acercarse. */
  rail?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        "hidden md:flex shrink-0 min-h-screen flex-col sticky top-0",
        rail ? "rail" : "w-64"
      )}
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.008))",
        borderRight: "1px solid var(--edge)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className={clsx("py-7", rail ? "px-[1.15rem]" : "px-5")}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center poster text-sm text-white transition-transform group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, var(--accent-violet), var(--accent-magenta))",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 20px -6px color-mix(in srgb, var(--accent-magenta) 80%, transparent)",
            }}
          >
            KR
          </div>
          <div className={clsx("leading-none", rail && "rail-label")}>
            <div className="display text-[1.05rem] whitespace-nowrap">Music Manager</div>
            <div className="eyebrow mt-1 text-[0.58rem]">Estudio</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "relative flex items-center rounded-lg py-2.5 text-sm transition-all duration-200",
                rail ? "gap-3 pl-[0.85rem] pr-3" : "gap-3 px-3",
                active
                  ? "text-white"
                  : "text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.045]"
              )}
              style={
                active
                  ? {
                      background:
                        "linear-gradient(90deg, color-mix(in srgb, var(--accent-violet) 26%, transparent), transparent 85%)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
                    }
                  : undefined
              }
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full"
                  style={{
                    background: "linear-gradient(180deg, var(--accent-violet), var(--accent-magenta))",
                    boxShadow: "0 0 10px color-mix(in srgb, var(--accent-magenta) 90%, transparent)",
                  }}
                />
              )}
              <Icon size={17} strokeWidth={active ? 2.3 : 1.9} className="shrink-0" />
              <span className={clsx(active && "font-medium", rail && "rail-label")}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4" style={{ borderTop: "1px solid var(--edge)" }}>
        {(userName || userEmail) && (
          <div
            className={clsx("px-2 mb-2 truncate", rail && "rail-label")}
            title={userEmail ?? undefined}
          >
            {userName && <div className="text-sm text-neutral-200">{userName}</div>}
            {userEmail && (
              <div
                className={clsx("text-neutral-500", userName ? "text-[0.7rem]" : "text-xs")}
              >
                {userEmail}
              </div>
            )}
          </div>
        )}
        <Link
          href="/ajustes"
          className={clsx(
            "w-full flex items-center gap-3 rounded-lg py-2 text-sm transition-colors",
            rail ? "pl-[0.85rem] pr-3" : "px-3",
            pathname.startsWith("/ajustes")
              ? "text-fuchsia-300"
              : "text-neutral-500 hover:bg-white/[0.045] hover:text-neutral-100"
          )}
        >
          <Settings2 size={16} className="shrink-0" />
          <span className={rail ? "rail-label" : undefined}>Ajustes</span>
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className={clsx(
              "w-full flex items-center gap-3 rounded-lg py-2 text-sm text-neutral-500 hover:bg-white/[0.045] hover:text-neutral-100 transition-colors",
              rail ? "pl-[0.85rem] pr-3" : "px-3"
            )}
          >
            <LogOut size={16} className="shrink-0" />
            <span className={rail ? "rail-label" : undefined}>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
