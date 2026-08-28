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
      className="sticky top-0 z-40 px-4 pt-5 pb-6 flex justify-center relative"
      style={{
        /* Aquí no vale el velo de color que uso abajo: la cabecera cae justo
           donde el haz es más brillante y un fondo opaco lo apagaría. Con
           desenfoque el texto que pasa por detrás se deshace igual, pero el
           haz solo se suaviza. La máscara evita el corte recto al terminar. */
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        maskImage: "linear-gradient(180deg, black 62%, transparent)",
        WebkitMaskImage: "linear-gradient(180deg, black 62%, transparent)",
      }}
    >
      {/* Cápsula flotante: no ocupa el ancho de la pantalla, se ajusta a su
          contenido y flota sobre el fondo. Es la forma de la referencia. */}
      <div
        className="rounded-full"
        style={{
          background: "rgba(18,18,20,0.82)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 8px 32px -8px rgba(0,0,0,0.8)",
        }}
      >
        <div className="flex items-center gap-1 sm:gap-2 h-12 pl-5 pr-2">
          {/* Marca */}
          <Link href="/" className="shrink-0 mr-2 sm:mr-4">
            <span className="poster text-[0.92rem] text-white whitespace-nowrap">
              Music Manager
            </span>
          </Link>

          {/* Secciones */}
          <nav className="hidden xl:flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-[0.8rem] transition-colors whitespace-nowrap",
                  activo(item.href)
                    ? "text-white bg-white/[0.08]"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1 ml-auto shrink-0">
            {/* Se ve también en móvil: al quitar el botón duplicado de la
                página de Canciones, este quedó como único camino para crear.
                Sin clases de ocultar, porque `.btn` fija display fuera de
                capa y le gana a `hidden` de Tailwind: la clase no haría nada
                y el código diría lo contrario de lo que pasa. */}
            <Link
              href="/songs/new"
              className="rounded-full inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
              style={{
                background: "#ffffff",
                color: "#0a0a0a",
                padding: "0.45rem 0.95rem",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}
            >
              <Plus size={13} /> Nueva canción
            </Link>
            <Link
              href="/ajustes"
              aria-label="Ajustes"
              className="p-2 text-neutral-500 hover:text-white transition-colors"
            >
              <Settings2 size={16} />
            </Link>
            <form action={signOutAction} className="hidden xl:block">
              <button
                type="submit"
                aria-label="Cerrar sesión"
                title={userEmail ?? userName}
                className="p-2 text-neutral-500 hover:text-white transition-colors"
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

      {/* Desplegable en pantallas estrechas: cuelga de la cápsula. */}
      {abierto && (
        <div
          className="xl:hidden absolute top-[4.2rem] left-4 right-4 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(18,18,20,0.96)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 16px 48px -12px rgba(0,0,0,0.9)",
          }}
        >
          <div className="p-3 grid grid-cols-2 gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAbierto(false)}
                className={clsx(
                  "px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2.5",
                  activo(item.href) ? "text-white bg-white/[0.08]" : "text-neutral-400"
                )}
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
