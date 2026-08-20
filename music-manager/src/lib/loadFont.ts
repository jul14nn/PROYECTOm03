import { fontFamilyName } from "./assets";

export type FontOption = { id: string; name: string; family: string; url?: string };

/** Tipografías que ya vienen cargadas por la app. */
export const BUILTIN_FONTS: FontOption[] = [
  { id: "anton", name: "Anton (cartel)", family: "Anton" },
  { id: "geist", name: "Geist (limpia)", family: "var(--font-geist-sans), sans-serif" },
  { id: "georgia", name: "Georgia (serif)", family: "Georgia, serif" },
  { id: "impact", name: "Impact (contundente)", family: "Impact, sans-serif" },
];

const loaded = new Set<string>();

/**
 * Registra una tipografía subida por el artista para poder dibujarla en el
 * lienzo.
 *
 * Importa esperar a `load()`: si se dibuja en el canvas antes de que la
 * fuente esté lista, el navegador no espera y pinta con la de reserva sin
 * avisar. Es el fallo clásico de los generadores de vídeo con fuentes.
 */
export async function ensureFontLoaded(assetId: string, url: string): Promise<string> {
  const family = fontFamilyName(assetId);
  if (loaded.has(family)) return family;

  const face = new FontFace(family, `url(${JSON.stringify(url)})`);
  await face.load();
  document.fonts.add(face);
  loaded.add(family);
  return family;
}

/** Familia CSS lista para `ctx.font`, cargándola antes si hace falta. */
export async function resolveFontFamily(
  option: FontOption
): Promise<string> {
  if (option.url) {
    const family = await ensureFontLoaded(option.id, option.url);
    return `"${family}"`;
  }
  return option.family;
}
