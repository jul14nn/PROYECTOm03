"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { NAV } from "@/lib/nav";
import { signOutAction } from "@/lib/actions/auth";
import { Settings2, LogOut, Plus, Menu } from "lucide-react";

/**
 * Navegación horizontal.
 *
 * Sustituye a la barra lateral: la referencia coloca marca, secciones y
 * acción principal en una sola línea superior. Devuelve el ancho completo al
 * contenido y hace que la primera pantalla empiece por el trabajo y no por
 * el menú.
 */
export default function TopNav({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const activo = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "rgba(3,3,3,0.86)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--edge)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-6 h-14">
          {/* Marca */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span
              className="h-6 w-6 rounded flex items-center justify-center text-[0.6rem] font-bold"
              style={{ background: "var(--accent)", color: "#04170f" }}
            >
              KR
            </span>
            <span className="poster text-[0.95rem] hidden sm:block">Music Manager</span>
          </Link>

          {/* Secciones */}
          <nav className="hidden xl:flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "px-3 py-1.5 rounded text-[0.8rem] transition-colors whitespace-nowrap",
                  activo(item.href)
                    ? "text-white"
                    : "text-neutral-400 hover:text-neutral-100"
                )}
                style={
                  activo(item.href)
                    ? { background: "var(--surface-2)", border: "1px solid var(--edge)" }
                    : undefined
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Se ve también en móvil: al quitar el botón duplicado de la
                página de Canciones, este quedó como único camino para crear.
                Sin clases de ocultar, porque `.btn` fija display fuera de
                capa y le gana a `hidden` de Tailwind: la clase no haría nada
                y el código diría lo contrario de lo que pasa. */}
            <Link
              href="/songs/new"
              className="btn btn-primary"
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem" }}
            >
              <Plus size={14} /> Nueva canción
            </Link>
            <Link
              href="/ajustes"
              aria-label="Ajustes"
              className="p-2 text-neutral-500 hover:text-neutral-200 transition-colors"
            >
              <Settings2 size={16} />
            </Link>
            <form action={signOutAction} className="hidden xl:block">
              <button
                type="submit"
                aria-label="Cerrar sesión"
                title={userEmail ?? userName}
                className="p-2 text-neutral-500 hover:text-neutral-200 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </form>
            <button
              type="button"
              onClick={() => setAbierto((v) => !v)}
              aria-expanded={abierto}
              aria-label="Menú"
              className="xl:hidden p-2 text-neutral-300"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Desplegable en pantallas estrechas */}
      {abierto && (
        <div className="xl:hidden" style={{ borderTop: "1px solid var(--edge)" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 grid grid-cols-2 gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAbierto(false)}
                className={clsx(
                  "px-3 py-2.5 rounded text-sm transition-colors flex items-center gap-2.5",
                  activo(item.href) ? "text-white" : "text-neutral-400"
                )}
                style={
                  activo(item.href) ? { background: "var(--surface-2)" } : undefined
                }
              >
                <item.icon size={15} />
                {item.label}
              </Link>
            ))}
            <form action={signOutAction} className="col-span-2 pt-2">
              <button
                type="submit"
                className="px-3 py-2.5 text-sm text-neutral-500 flex items-center gap-2.5"
              >
                <LogOut size={15} /> Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
