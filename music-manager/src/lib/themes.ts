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

export const SIDEBAR_MODES = [
  {
    id: "fijo",
    name: "Fijo",
    description: "Columna con icono y etiqueta siempre visibles.",
  },
  {
    id: "rail",
    name: "Raíl",
    description:
      "Solo iconos; se despliega al acercar el ratón. Devuelve unos 12rem de ancho al contenido.",
  },
] as const;

export type SidebarMode = (typeof SIDEBAR_MODES)[number]["id"];
