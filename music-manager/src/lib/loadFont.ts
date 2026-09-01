import { fontFamilyName } from "./assets";

/**
 * Tipografías para los subtítulos del vídeo.
 *
 * Dos trampas que este módulo existe para evitar:
 *
 * 1. El lienzo NO entiende variables CSS. Poner `ctx.font = "60px
 *    var(--font-x)"` no falla: se ignora la asignación entera y se dibuja
 *    con la fuente anterior, sin ningún aviso. Por eso aquí se resuelve la
 *    variable a su valor real antes de devolverla.
 * 2. El navegador solo descarga una fuente cuando algo la usa. Si únicamente
 *    la pide el lienzo, puede no haberse descargado todavía y se pinta con
 *    la de reserva. Por eso se llama a `document.fonts.load` antes.
 */

export type FontOption = {
  id: string;
  name: string;
  /** Familia literal, para fuentes del sistema. */
  family?: string;
  /** Variable CSS de una fuente cargada con next/font. */
  cssVar?: string;
  /** URL de una fuente subida por el artista. */
  url?: string;
};

/**
 * Las que se ven una y otra vez en vídeos de fondo con subtítulo centrado.
 * El orden es el de uso real, no alfabético: lo primero que se ofrece debería
 * ser lo que la mayoría acaba eligiendo.
 */
export const BUILTIN_FONTS: FontOption[] = [
  { id: "montserrat", name: "Montserrat — la más usada", cssVar: "--font-montserrat" },
  { id: "poppins", name: "Poppins — redondeada, amable", cssVar: "--font-poppins" },
  { id: "bebas", name: "Bebas Neue — mayúsculas estrechas", cssVar: "--font-bebas" },
  { id: "oswald", name: "Oswald — condensada, titular", cssVar: "--font-oswald" },
  { id: "roboto", name: "Roboto — neutra, se lee siempre", cssVar: "--font-roboto" },
  { id: "anton", name: "Anton — cartel, muy gruesa", cssVar: "--font-poster" },
  { id: "inter", name: "Inter — la de la app", cssVar: "--font-display" },
  { id: "georgia", name: "Georgia — serif clásica", family: "Georgia, serif" },
];

/**
 * El id que se usa cuando todavía no hay kit de marca.
 *
 * Estaba escrito a mano como "Anton" en tres sitios, con mayúscula, y ningún
 * id lo lleva. La acción de guardar llegaba a escribir ese literal en la base
 * de datos, y desde ahí toda búsqueda por id fallaba y caía a la primera
 * opción sin avisar. Debe coincidir con el `@default` de BrandKit.fontFamily.
 */
export const DEFAULT_FONT_ID = "montserrat";

const cargadas = new Set<string>();

/**
 * Registra una tipografía subida por el artista para poder dibujarla.
 *
 * Importa esperar a `load()`: si se dibuja antes de que esté lista, el
 * navegador no espera y pinta con la de reserva sin avisar. Es el fallo
 * clásico de los generadores de vídeo con fuentes propias.
 */
export async function ensureFontLoaded(assetId: string, url: string): Promise<string> {
  const family = fontFamilyName(assetId);
  if (cargadas.has(family)) return family;

  const face = new FontFace(family, `url(${JSON.stringify(url)})`);
  await face.load();
  document.fonts.add(face);
  cargadas.add(family);
  return family;
}

/** Valor real de una variable CSS, o null si no está definida. */
function valorDeVariable(nombre: string): string | null {
  if (typeof document === "undefined") return null;
  const v = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  return v || null;
}

/**
 * Familia lista para `ctx.font`, ya descargada.
 *
 * El grosor 600 es el que usa el dibujo de subtítulos; hay que pedirlo tal
 * cual, porque `document.fonts.load` descarga por variante y cargar el
 * grosor normal no traería el semi-negrita.
 */
export async function resolveFontFamily(option: FontOption): Promise<string> {
  if (option.url) {
    const family = await ensureFontLoaded(option.id, option.url);
    return `"${family}"`;
  }

  const family = option.cssVar
    ? valorDeVariable(option.cssVar) ?? "sans-serif"
    : option.family ?? "sans-serif";

  if (typeof document !== "undefined") {
    try {
      await document.fonts.load(`600 60px ${family}`);
      await document.fonts.ready;
    } catch {
      // Una familia que el navegador no reconoce no debe tumbar el montaje:
      // se dibujará con la de reserva, que es lo que habría pasado igualmente.
    }
  }
  return family;
}
