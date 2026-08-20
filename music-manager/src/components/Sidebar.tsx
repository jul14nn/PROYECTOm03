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
}: {
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex w-64 shrink-0 min-h-screen flex-col sticky top-0"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.008))",
        borderRight: "1px solid var(--edge)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="px-5 py-7">
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
          <div className="leading-none">
            <div className="display text-[1.05rem]">Music Manager</div>
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
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
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
              <Icon size={17} strokeWidth={active ? 2.3 : 1.9} />
              <span className={active ? "font-medium" : undefined}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4" style={{ borderTop: "1px solid var(--edge)" }}>
        {(userName || userEmail) && (
          <div className="px-2 mb-2 truncate" title={userEmail ?? undefined}>
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
            "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname.startsWith("/ajustes")
              ? "text-fuchsia-300"
              : "text-neutral-500 hover:bg-white/[0.045] hover:text-neutral-100"
          )}
        >
          <Settings2 size={16} />
          Ajustes
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-white/[0.045] hover:text-neutral-100 transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
