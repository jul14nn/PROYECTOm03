export const THEMES = [
  {
    id: "neon",
    name: "Neón Nocturno",
    description: "Luces de escenario sobre negro, con tipografía de cartel condensada.",
  },
  {
    id: "bits",
    name: "8 bits",
    description:
      "Cartucho de arcade: tipografía de píxel, esquinas a cero, medidores por segmentos y animaciones a saltos.",
  },
  {
    id: "vinilo",
    name: "Vinilo",
    description: "Negro cálido, crema y ámbar quemado, con serif de revista musical.",
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export function isTheme(v: string | null | undefined): v is ThemeId {
  return THEMES.some((t) => t.id === v);
}

/* SIDEBAR_MODES se retiró al pasar a navegación horizontal: ya no hay barra
   lateral que configurar. La columna sigue en la base de datos por si alguna
   vez vuelve, pero nada la lee. */
