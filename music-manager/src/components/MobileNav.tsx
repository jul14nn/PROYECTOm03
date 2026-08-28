"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MOBILE_PRIMARY, MOBILE_SECONDARY, type NavItem } from "@/lib/nav";
import { MoreHorizontal } from "lucide-react";
import clsx from "clsx";

export function MobileTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const secondaryActive = MOBILE_SECONDARY.some((i) => isActive(i.href));

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMoreOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 backdrop-blur-xl"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          background: "linear-gradient(0deg, rgba(10,9,14,0.96), rgba(16,14,22,0.86))",
          borderTop: "1px solid var(--edge)",
        }}
      >
        {moreOpen && (
          <div className="px-3 pt-3 pb-1" style={{ borderBottom: "1px solid var(--edge)" }}>
            {MOBILE_SECONDARY.map((item) => (
              <MoreLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onNavigate={() => setMoreOpen(false)}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-5">
          {MOBILE_PRIMARY.map((item) => (
            <TabLink key={item.href} item={item} active={isActive(item.href)} />
          ))}

          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className={clsx(
              "relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] leading-tight transition-colors",
              moreOpen || secondaryActive ? "text-fuchsia-300" : "text-neutral-500"
            )}
          >
            {secondaryActive && !moreOpen && <ActiveMark />}
            <MoreHorizontal size={19} strokeWidth={moreOpen || secondaryActive ? 2.4 : 2} />
            <span>Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function ActiveMark() {
  return (
    <span
      aria-hidden
      className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-7 rounded-b-full"
      style={{
        background: "linear-gradient(90deg, var(--accent-violet), var(--accent-magenta))",
        boxShadow: "0 0 10px color-mix(in srgb, var(--accent-magenta) 90%, transparent)",
      }}
    />
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const { href, label, icon: Icon } = item;
  return (
    <Link
      href={href}
      className={clsx(
        "relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] leading-tight transition-colors",
        active ? "text-fuchsia-300" : "text-neutral-500"
      )}
    >
      {active && <ActiveMark />}
      <Icon size={19} strokeWidth={active ? 2.4 : 2} />
      <span>{label}</span>
    </Link>
  );
}

function MoreLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const { href, label, icon: Icon } = item;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
        active ? "text-fuchsia-300" : "text-neutral-300 hover:bg-white/[0.05]"
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}
