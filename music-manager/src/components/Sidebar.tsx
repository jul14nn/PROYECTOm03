"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Music4,
  CalendarDays,
  Users,
  Truck,
  Megaphone,
  Coins,
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/songs", label: "Canciones", icon: Music4 },
  { href: "/calendar", label: "Agenda", icon: CalendarDays },
  { href: "/contacts", label: "Contactos", icon: Users },
  { href: "/distribution", label: "Distribución", icon: Truck },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/royalties", label: "Royalties", icon: Coins },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-neutral-800 min-h-screen flex flex-col">
      <div className="px-5 py-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold">
            M
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
                  ? "bg-indigo-500/15 text-indigo-300"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-xs text-neutral-600">
        Producción musical, de la idea al lanzamiento.
      </div>
    </aside>
  );
}
