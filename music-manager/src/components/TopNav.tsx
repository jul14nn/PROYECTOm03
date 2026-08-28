"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { NAV } from "@/lib/nav";
import { signOutAction } from "@/lib/actions/auth";
import { Settings2, LogOut, Plus, Menu, X } from "lucide-react";

/**
 * La navegación entera de la app.
 *
 * Un solo menú: el desplegable de la cápsula. Antes había tres caminos a las
 * mismas ocho secciones —enlaces en línea en pantallas anchas, este
 * desplegable en estrechas y una barra de pestañas abajo en el móvil—, y
 * mantener los tres sincronizados era la razón de que el color viejo
 * sobreviviera meses en uno de ellos.
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
  const caja = useRef<HTMLDivElement>(null);

  // Al navegar se cierra solo: si no, al volver atrás reaparece abierto.
  // Ajustado durante el render en vez de en un efecto; hacerlo en un efecto
  // pinta primero el menú abierto en la ruta nueva y lo cierra después.
  const [rutaPrevia, setRutaPrevia] = useState(pathname);
  if (rutaPrevia !== pathname) {
    setRutaPrevia(pathname);
    setAbierto(false);
  }

  // Siendo el único menú tiene que cerrarse como se espera de un menú:
  // tocando fuera y con Escape. Sin esto se queda tapando la pantalla.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const activo = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 px-4 pt-5 pb-6 flex justify-center">
      {/* El velo va en una capa aparte, no en la cabecera.
          Con la máscara puesta en el <header> se recortaban también sus
          hijos, y el desplegable —que cuelga justo de la zona donde la
          máscara ya es transparente— quedaba invisible aunque estuviera
          montado y respondiendo. Aquí no vale un velo de color: la cabecera
          cae donde el haz más brilla y un fondo opaco lo apagaría; el
          desenfoque deshace el texto que pasa por detrás y deja pasar la luz. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          maskImage: "linear-gradient(180deg, black 62%, transparent)",
          WebkitMaskImage: "linear-gradient(180deg, black 62%, transparent)",
        }}
      />

      <div ref={caja} className="relative">
        {/* Cápsula flotante: se ajusta a su contenido y flota sobre el fondo. */}
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
            <Link href="/" className="shrink-0 mr-3 sm:mr-6">
              <span className="poster text-[0.92rem] text-white whitespace-nowrap">
                Music Manager
              </span>
            </Link>

            <div className="flex items-center gap-1 shrink-0">
              {/* Crear no es navegar: se queda fuera del menú, a la vista.
                  Sin clases de ocultar, porque `.btn` fija display fuera de
                  capa y le gana a `hidden` de Tailwind. */}
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

              <button
                type="button"
                onClick={() => setAbierto((v) => !v)}
                aria-expanded={abierto}
                aria-haspopup="menu"
                aria-label={abierto ? "Cerrar menú" : "Menú"}
                className="p-2 ml-0.5 text-neutral-300 hover:text-white transition-colors"
              >
                {abierto ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Desplegable: cuelga de la cápsula y comparte su ancho. */}
        {abierto && (
          <div
            role="menu"
            className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden"
            style={{
              /* Opaco, no translúcido como la cápsula: con el 3% que dejaba
                 pasar se leía el texto de la página por detrás de las
                 entradas y el menú se ensuciaba. */
              background: "#141416",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 16px 48px -12px rgba(0,0,0,0.9)",
            }}
          >
            <div className="p-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className={clsx(
                    "px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3",
                    activo(item.href)
                      ? "text-white bg-white/[0.08]"
                      : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <item.icon size={15} className="shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div
              className="p-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Link
                href="/ajustes"
                role="menuitem"
                className={clsx(
                  "px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3",
                  activo("/ajustes")
                    ? "text-white bg-white/[0.08]"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <Settings2 size={15} className="shrink-0" />
                Ajustes
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  role="menuitem"
                  title={userEmail ?? userName}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-neutral-500 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-3"
                >
                  <LogOut size={15} className="shrink-0" />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
