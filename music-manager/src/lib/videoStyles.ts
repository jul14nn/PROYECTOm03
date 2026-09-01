export type VideoStyleId = "neon" | "poster" | "minimal" | "waves" | "slideshow";

export const VIDEO_STYLES: { id: VideoStyleId; name: string; description: string; usesImages: boolean }[] = [
  {
    id: "neon",
    name: "Neón Nocturno",
    description: "Degradado violeta-magenta-ámbar sobre negro, como la propia app.",
    usesImages: true,
  },
  {
    id: "poster",
    name: "Cartel Rockstar",
    description: "Cortes duros, marco grueso, tipografía enorme.",
    usesImages: true,
  },
  {
    id: "minimal",
    name: "Lyric Mínimal",
    description: "Fondo limpio con el color de la canción, texto centrado.",
    usesImages: true,
  },
  {
    id: "waves",
    name: "Visualizer de Ondas",
    description: "Barras animadas (decorativas) en el color de la canción. No usa imágenes.",
    usesImages: false,
  },
  {
    id: "slideshow",
    name: "Slideshow de Referencias",
    description: "Tus imágenes de referencia en fundido, con el título abajo.",
    usesImages: true,
  },
];

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}
