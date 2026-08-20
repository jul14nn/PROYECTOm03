"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { signOutAction } from "@/lib/actions/auth";
import { LogOut } from "lucide-react";
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
    <aside className="hidden md:flex w-60 shrink-0 border-r border-neutral-800 min-h-screen flex-col">
      <div className="px-5 py-6">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center poster text-sm text-white"
            style={{ background: "linear-gradient(135deg, var(--accent-violet), var(--accent-magenta))" }}
          >
            KR
          </div>
          <span className="font-semibold text-lg">Music Manager</span>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-fuchsia-500/15 text-fuchsia-300"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-neutral-800">
        {(userName || userEmail) && (
          <div className="px-2 mb-2 truncate" title={userEmail ?? undefined}>
            {userName && <div className="text-sm text-neutral-200">{userName}</div>}
            {userEmail && (
              <div className={clsx("text-xs text-neutral-500", userName && "text-[0.7rem]")}>
                {userEmail}
              </div>
            )}
          </div>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100 transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
