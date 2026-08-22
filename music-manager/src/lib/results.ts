/**
 * Qué te funciona.
 *
 * La app planificaba mucho y no medía nada, así que cada lanzamiento
 * empezaba de cero. Aquí se agregan las publicaciones ya hechas para
 * responder a la única pregunta que importa: qué repetir y qué dejar de
 * hacer.
 *
 * Regla de fondo: no se enseñan totales acumulados, que solo suben y hacen
 * sentir bien sin decir nada. Se enseñan medias comparables entre sí.
 */

export type Plataforma = "TIKTOK" | "INSTAGRAM" | "YOUTUBE" | "SPOTIFY" | "OTRA";

export const PLATAFORMAS: { id: Plataforma; name: string }[] = [
  { id: "TIKTOK", name: "TikTok" },
  { id: "INSTAGRAM", name: "Instagram" },
  { id: "YOUTUBE", name: "YouTube" },
  { id: "SPOTIFY", name: "Spotify" },
  { id: "OTRA", name: "Otra" },
];

/** Formatos sugeridos. Son sugerencias: se puede escribir cualquier otro. */
export const FORMATOS_SUGERIDOS = [
  "Clip con letra",
  "Detrás de cámaras",
  "Fragmento en directo",
  "Proceso de producción",
  "Reto o trend",
  "Anuncio pagado",
  "Anuncio de lanzamiento",
];

export type Post = {
  id: string;
  songId: string | null;
  songTitle?: string | null;
  platform: Plataforma;
  format: string;
  postedAt: Date;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

/**
 * Interacción por cada cien visualizaciones.
 *
 * Es más honesto que el número bruto: una pieza con 500 visitas y 80
 * guardados dice más sobre la canción que otra con 50.000 y 12.
 */
export function engagement(p: Post) {
  if (!p.views) return 0;
  return ((p.likes + p.comments + p.shares + p.saves) / p.views) * 100;
}

export type Grupo = {
  clave: string;
  n: number;
  mediaVistas: number;
  mediaEngagement: number;
  mejor: Post | null;
};

function agrupar(posts: Post[], por: (p: Post) => string): Grupo[] {
  const mapa = new Map<string, Post[]>();
  for (const p of posts) {
    const k = por(p);
    mapa.set(k, [...(mapa.get(k) ?? []), p]);
  }
  return [...mapa.entries()]
    .map(([clave, ps]) => ({
      clave,
      n: ps.length,
      mediaVistas: Math.round(ps.reduce((a, p) => a + p.views, 0) / ps.length),
      mediaEngagement:
        Math.round((ps.reduce((a, p) => a + engagement(p), 0) / ps.length) * 10) / 10,
      mejor: ps.reduce<Post | null>((m, p) => (!m || p.views > m.views ? p : m), null),
    }))
    .sort((a, b) => b.mediaVistas - a.mediaVistas);
}

export function porFormato(posts: Post[]) {
  return agrupar(posts, (p) => p.format);
}

export function porPlataforma(posts: Post[]) {
  return agrupar(posts, (p) => p.platform);
}

export type Conclusion = { texto: string; tono: "bueno" | "aviso" | "neutro" };

/**
 * Conclusiones en lenguaje llano.
 *
 * Solo se afirma algo cuando hay base para afirmarlo: con dos publicaciones
 * de un formato no se puede decir que "funciona". El umbral evita que la app
 * suene segura de cosas que no sabe.
 */
export function conclusiones(posts: Post[]): Conclusion[] {
  const out: Conclusion[] = [];
  const MIN = 3; // publicaciones mínimas por grupo para sacar conclusiones

  if (posts.length === 0) {
    return [
      {
        texto:
          "Todavía no has registrado ninguna publicación. En cuanto anotes tres o cuatro, aquí aparecerá qué formato te está funcionando mejor.",
        tono: "neutro",
      },
    ];
  }

  const formatos = porFormato(posts).filter((g) => g.n >= MIN);
  if (formatos.length >= 2) {
    const mejor = formatos[0];
    const peor = formatos[formatos.length - 1];
    if (peor.mediaVistas > 0 && mejor.mediaVistas >= peor.mediaVistas * 1.5) {
      const veces = decimal(mejor.mediaVistas / peor.mediaVistas);
      out.push({
        texto: `«${mejor.clave}» te rinde ${veces}× más que «${peor.clave}» (${mejor.mediaVistas.toLocaleString("es-ES")} visitas de media frente a ${peor.mediaVistas.toLocaleString("es-ES")}). Repite el primero.`,
        tono: "bueno",
      });
    }
  } else if (formatos.length === 1) {
    out.push({
      texto: `Solo «${formatos[0].clave}» tiene publicaciones suficientes para sacar conclusiones. Prueba otro formato para poder comparar.`,
      tono: "neutro",
    });
  } else {
    out.push({
      texto: `Aún no hay ${MIN} publicaciones de ningún formato. Con tan pocas, cualquier conclusión sería casualidad.`,
      tono: "neutro",
    });
  }

  // La pieza que más enganchó, aunque no sea la más vista.
  const conVistas = posts.filter((p) => p.views >= 100);
  if (conVistas.length >= MIN) {
    const top = conVistas.reduce((m, p) => (engagement(p) > engagement(m) ? p : m));
    const masVista = conVistas.reduce((m, p) => (p.views > m.views ? p : m));
    if (top.id !== masVista.id) {
      out.push({
        texto: `Tu pieza más vista no es la que más enganchó: «${top.format}» del ${top.postedAt.toLocaleDateString("es-ES")} tiene ${decimal(engagement(top))} interacciones por cada 100 visitas. El alcance no siempre es lo que convierte.`,
        tono: "neutro",
      });
    }
  }

  const plataformas = porPlataforma(posts).filter((g) => g.n >= MIN);
  if (plataformas.length >= 2) {
    const mejor = plataformas[0];
    out.push({
      texto: `Donde mejor te va es en ${nombrePlataforma(mejor.clave as Plataforma)}: ${mejor.mediaVistas.toLocaleString("es-ES")} visitas de media en ${mejor.n} publicaciones.`,
      tono: "bueno",
    });
  }

  // Constancia: publicar a rachas y desaparecer es el patrón más común.
  const ultimos30 = posts.filter(
    (p) => Date.now() - p.postedAt.getTime() < 30 * 86400000
  ).length;
  if (posts.length >= 5 && ultimos30 === 0) {
    out.push({
      texto:
        "Llevas más de un mes sin publicar nada. Lo que más penaliza el alcance es desaparecer, no publicar poco.",
      tono: "aviso",
    });
  }

  return out;
}

export function nombrePlataforma(p: Plataforma) {
  return PLATAFORMAS.find((x) => x.id === p)?.name ?? p;
}

/** Decimal en castellano: 5.8 → «5,8». */
export function decimal(n: number, cifras = 1) {
  return n.toFixed(cifras).replace(".", ",");
}

/** Número compacto: 12.400 → 12,4 k. Las cifras largas no se leen. */
export function compacto(n: number) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(".0", "").replace(".", ",")} k`;
  return `${(n / 1_000_000).toFixed(1).replace(".0", "").replace(".", ",")} M`;
}

/**
 * Lee un número tal y como se copia de TikTok o Spotify.
 *
 * Nadie escribe "12400": copia "12,4K", "1.234" o "12.4k". Si esto falla,
 * los datos quedan mal sin que nadie se entere, así que acepta las tres
 * formas y descarta lo que no entienda en vez de inventar.
 */
export function parseNumero(raw: string | null | undefined): number {
  if (!raw) return 0;
  const limpio = raw.toLowerCase().replace(/\s/g, "");
  const factor = limpio.endsWith("k") ? 1000 : limpio.endsWith("m") ? 1_000_000 : 1;
  let cuerpo = limpio.replace(/[km]$/, "");
  // "1.234" es mil doscientos treinta y cuatro; "12.4k" son doce mil cuatrocientos.
  if (factor > 1) cuerpo = cuerpo.replace(",", ".");
  else cuerpo = cuerpo.replace(/\./g, "").replace(",", ".");
  const n = Number(cuerpo);
  return Number.isFinite(n) ? Math.max(0, Math.round(n * factor)) : 0;
}
