"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import clsx from "clsx";

export function MobileTopBar() {
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center gap-2 px-4 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.7rem)", paddingBottom: "0.7rem" }}
    >
      <div className="h-7 w-7 rounded-md bg-indigo-500 flex items-center justify-center font-bold text-sm shrink-0">
        M
      </div>
      <span className="font-semibold text-sm">Music Manager</span>
    </header>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40 grid border-t border-neutral-800 bg-neutral-950/95 backdrop-blur"
      style={{
        gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] leading-tight transition-colors",
              active ? "text-indigo-300" : "text-neutral-500"
            )}
          >
            <Icon size={19} strokeWidth={active ? 2.4 : 2} />
            <span className="truncate max-w-[3.4rem]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
