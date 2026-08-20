/**
 * Playbook de lanzamiento para artista independiente.
 *
 * Cada paso lleva un desfase en días respecto a la fecha de lanzamiento
 * (negativo = antes). Los plazos no son arbitrarios: los de distribución y
 * pitch vienen de los mínimos reales que piden las plataformas, y el resto
 * está colocado para que el trabajo pesado no caiga en la semana de salida,
 * que es cuando menos cabeza tienes.
 */

export const PHASES = [
  {
    id: "FUNDAMENTOS",
    name: "Fundamentos",
    window: "8 a 5 semanas antes",
    goal: "Dejar la canción lista para subir. Nada de promoción todavía.",
  },
  {
    id: "ACTIVOS",
    name: "Activos",
    window: "5 a 3 semanas antes",
    goal: "Fabricar de una tirada todo el contenido que vas a necesitar después.",
  },
  {
    id: "CALENTAMIENTO",
    name: "Calentamiento",
    window: "3 a 1 semana antes",
    goal: "Que la gente sepa que viene algo, sin quemar el estribillo.",
  },
  {
    id: "CUENTA_ATRAS",
    name: "Cuenta atrás",
    window: "Última semana",
    goal: "Máxima frecuencia y empujón de pre-guardado.",
  },
  {
    id: "SALIDA",
    name: "Salida",
    window: "El día",
    goal: "Estar en todas partes el mismo día, con todo preparado de antes.",
  },
  {
    id: "SOSTENER",
    name: "Sostener",
    window: "4 semanas después",
    goal: "Donde se gana de verdad. Casi nadie hace esta parte.",
  },
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];

export type LaunchStep = {
  key: string;
  title: string;
  detail: string;
  phase: PhaseId;
  /** Días respecto al lanzamiento. Negativo = antes. */
  day: number;
  channel: string;
  /** Coste estimado en euros, si el paso lleva dinero. */
  cost?: number;
};

export const LAUNCH_STEPS: LaunchStep[] = [
  // ---------------------------------------------------------------- FUNDAMENTOS
  {
    key: "master",
    title: "Aprobar el máster definitivo",
    detail:
      "Escúchalo en coche, en auriculares baratos y en el altavoz del móvil. Si aguanta en los tres, está. No lo apruebes el mismo día que lo recibes: déjalo reposar 48 horas.",
    phase: "FUNDAMENTOS",
    day: -56,
    channel: "Producción",
  },
  {
    key: "portada",
    title: "Portada final a 3000×3000 px",
    detail:
      "JPG o PNG, cuadrada, mínimo 3000 px. Sin logos de terceros, sin URLs, sin nombres de redes y sin texto promocional tipo «nuevo single»: las tiendas rechazan la portada y pierdes días.",
    phase: "FUNDAMENTOS",
    day: -52,
    channel: "Diseño",
  },
  {
    key: "metadatos",
    title: "Cerrar metadatos y créditos",
    detail:
      "Título exacto (decide ya si el feat va en el título o en el nombre del artista), compositores, letristas, productores e ISRC. Corregir esto después del lanzamiento obliga a volver a subir y pierdes las reproducciones acumuladas.",
    phase: "FUNDAMENTOS",
    day: -49,
    channel: "Distribuidora",
  },
  {
    key: "splits",
    title: "Firmar los splits con todos los implicados",
    detail:
      "Por escrito y antes de que salga, aunque sea un mensaje con los porcentajes y un «de acuerdo» de cada uno. Los splits se discuten fatal cuando ya hay dinero encima de la mesa.",
    phase: "FUNDAMENTOS",
    day: -45,
    channel: "Legal",
  },
  {
    key: "subir",
    title: "Subir a la distribuidora",
    detail:
      "Mínimo 4 semanas antes. Con menos de 3 pierdes la ventana de pitch editorial de Spotify, y con menos de 2 algunas tiendas ni te garantizan estar el día que pides.",
    phase: "FUNDAMENTOS",
    day: -35,
    channel: "Distribuidora",
  },

  // -------------------------------------------------------------------- ACTIVOS
  {
    key: "pitch",
    title: "Pitchear en Spotify for Artists",
    detail:
      "Solo puedes tener una canción sin lanzar pitcheada a la vez, así que hazlo en cuanto la distribuidora la entregue. Describe el mood, el contexto y con qué artistas encaja; no la vendas. Pitchear también activa el «Novedades para ti» de tus seguidores aunque no te cojan en playlist editorial.",
    phase: "ACTIVOS",
    day: -30,
    channel: "Spotify",
  },
  {
    key: "clips",
    title: "Grabar el pack de clips verticales de una tirada",
    detail:
      "10 a 15 clips en una sola sesión. Vas a necesitar muchos más de los que crees, y grabar suelto cada día es lo que hace que la gente abandone a mitad de campaña. Varía ropa y localización dentro de la misma sesión para que no parezcan del mismo día.",
    phase: "ACTIVOS",
    day: -28,
    channel: "TikTok",
  },
  {
    key: "lyric",
    title: "Montar el lyric video",
    detail:
      "Se sube a YouTube el mismo día del lanzamiento. Es la vía más barata de aparecer cuando alguien busca un trozo de la letra, que es como te encuentra la gente que oyó la canción sin saber de quién era.",
    phase: "ACTIVOS",
    day: -26,
    channel: "YouTube",
  },
  {
    key: "canvas",
    title: "Preparar el Canvas de Spotify",
    detail:
      "Vertical 9:16, entre 3 y 8 segundos, en bucle y sin texto. Es de lo poco que Spotify confirma que sube compartidos y guardados. Con el generador de vídeos de la app tienes uno en un minuto.",
    phase: "ACTIVOS",
    day: -24,
    channel: "Spotify",
  },
  {
    key: "fotos",
    title: "Fotos de prensa",
    detail:
      "Mínimo 3 verticales y 2 horizontales, en alta. Te las van a pedir playlists, blogs y cualquiera que te programe. No tenerlas a mano es la razón más tonta por la que se cae una publicación.",
    phase: "ACTIVOS",
    day: -22,
    channel: "Diseño",
  },
  {
    key: "presave",
    title: "Crear el enlace de pre-guardado",
    detail:
      "Un solo enlace para todas las plataformas. Es el activo que más rinde de todo el mes previo: cada pre-guardado se convierte en una reproducción el día 1, y las reproducciones del día 1 son las que deciden si el algoritmo te empuja.",
    phase: "ACTIVOS",
    day: -21,
    channel: "Web",
  },

  // -------------------------------------------------------------- CALENTAMIENTO
  {
    key: "teaser",
    title: "Primer teaser de ambiente",
    detail:
      "Estudio, proceso, referencias visuales. Sin enseñar el estribillo todavía: si quemas el gancho tres semanas antes, el día del lanzamiento ya no sorprende a nadie.",
    phase: "CALENTAMIENTO",
    day: -20,
    channel: "TikTok",
  },
  {
    key: "anuncio",
    title: "Anuncio de fecha con la portada",
    detail:
      "A partir de aquí ya puedes repetir el anuncio sin quemar: la gente no ve ni la cuarta parte de lo que publicas. Pon el enlace de pre-guardado en la bio el mismo día.",
    phase: "CALENTAMIENTO",
    day: -18,
    channel: "Instagram",
  },
  {
    key: "curators",
    title: "Escribir a 20-30 playlists pequeñas",
    detail:
      "Apunta a listas de 1.000 a 10.000 oyentes. Las grandes no contestan y las pequeñas convierten mucho mejor por seguidor. Mensaje corto, el enlace privado de la distribuidora y por qué encaja en ESA lista concreta: si no la has escuchado, se nota.",
    phase: "CALENTAMIENTO",
    day: -16,
    channel: "Playlists",
  },
  {
    key: "hook",
    title: "Enseñar el hook por primera vez",
    detail:
      "Un solo trozo, el más pegadizo, en bucle. Este es el clip que vas a repetir con variaciones hasta el lanzamiento, así que elige bien: el que mejor retención tenga, no el que más te guste a ti.",
    phase: "CALENTAMIENTO",
    day: -14,
    channel: "TikTok",
  },
  {
    key: "ads-setup",
    title: "Dejar montada la campaña de Meta Ads",
    detail:
      "Píxel instalado y tres públicos creados antes de necesitarlos: seguidores e interacciones, un público similar (lookalike) y uno de intereses por artistas parecidos. Montarlo con prisa el día de la salida es como se tira el presupuesto.",
    phase: "CALENTAMIENTO",
    day: -12,
    channel: "Meta Ads",
  },
  {
    key: "bts",
    title: "Detrás de cámaras de la grabación",
    detail:
      "Lo que peor suena y mejor funciona: la toma fallida, la discusión sobre el verso, el momento en que salió la idea. Es el contenido que más se comparte porque no parece promoción.",
    phase: "CALENTAMIENTO",
    day: -10,
    channel: "Instagram",
  },

  // --------------------------------------------------------------- CUENTA ATRÁS
  {
    key: "diario",
    title: "Empezar cadencia diaria en TikTok",
    detail:
      "Un clip al día hasta el lanzamiento, cada uno con un ángulo distinto: cuenta atrás, significado de la letra, reacción de alguien escuchándola, el proceso. Mismo audio, envoltorios diferentes.",
    phase: "CUENTA_ATRAS",
    day: -7,
    channel: "TikTok",
  },
  {
    key: "ads-calor",
    title: "Anuncios de «ya casi» a público cálido",
    detail:
      "Solo retargeting: quien ya vio tus vídeos o te sigue. 5 €/día durante 5 días. Objetivo tráfico hacia el pre-guardado. A público frío todavía no: sale caro y aún no hay nada que escuchar.",
    phase: "CUENTA_ATRAS",
    day: -5,
    channel: "Meta Ads",
    cost: 25,
  },
  {
    key: "feat",
    title: "Coordinar la publicación con el featuring",
    detail:
      "Pásale los clips ya montados y una fecha concreta. Si se lo dejas a su criterio, publica tarde o no publica. Su audiencia es la mitad del sentido de tener un feat.",
    phase: "CUENTA_ATRAS",
    day: -3,
    channel: "Colaboración",
  },
  {
    key: "presave-push",
    title: "Último empujón de pre-guardado",
    detail:
      "Story con encuesta o cuenta atrás y enlace directo. Escribe por privado a las 20 personas que sabes que van a decir que sí: los primeros guardados pesan más que los del día 5.",
    phase: "CUENTA_ATRAS",
    day: -2,
    channel: "Instagram",
  },
  {
    key: "programar",
    title: "Dejar programado todo lo del día 0",
    detail:
      "Posts escritos, clips exportados, enlaces acortados y el correo redactado. El día del lanzamiento vas a estar nervioso y refrescando números: no es el momento de escribir copys.",
    phase: "CUENTA_ATRAS",
    day: -1,
    channel: "Organización",
  },

  // --------------------------------------------------------------------- SALIDA
  {
    key: "post-salida",
    title: "Publicar el anuncio de salida",
    detail:
      "En todas las redes a la vez y a la hora en que tu público está despierto, no a las 00:00. Con enlace directo a la plataforma donde más te escuchan, no a un enlace intermedio.",
    phase: "SALIDA",
    day: 0,
    channel: "Todas",
  },
  {
    key: "pin",
    title: "Fijar el mejor clip y actualizar la bio",
    detail:
      "Fija en TikTok el clip que mejor funcionó en la cuenta atrás y cambia el enlace de la bio de pre-guardado a escucha. Suena obvio y se olvida constantemente.",
    phase: "SALIDA",
    day: 0,
    channel: "TikTok",
  },
  {
    key: "youtube",
    title: "Subir el lyric video a YouTube",
    detail:
      "El mismo día. En la descripción, la letra completa y los créditos: es lo que hace que aparezcas en las búsquedas de trozos de la letra durante años.",
    phase: "SALIDA",
    day: 0,
    channel: "YouTube",
  },
  {
    key: "correo",
    title: "Enviar el correo a tu lista",
    detail:
      "Aunque sean 40 personas. Es el único canal donde llegas al 100% y nadie decide por ti si te muestra. Un párrafo y el enlace.",
    phase: "SALIDA",
    day: 0,
    channel: "Email",
  },

  // ------------------------------------------------------------------ SOSTENER
  {
    key: "ads-conversion",
    title: "Arrancar anuncios de conversión a streaming",
    detail:
      "8-10 €/día durante 10 días. Objetivo tráfico, nunca interacción: te llenaría de likes que no escuchan. Empieza por el público cálido y ve abriendo a similares según qué anuncio aguante mejor el coste por clic.",
    phase: "SOSTENER",
    day: 1,
    channel: "Meta Ads",
    cost: 90,
  },
  {
    key: "angulos",
    title: "Sacar ángulos nuevos del mismo tema",
    detail:
      "La canción ya está fuera, pero la mayoría de la gente aún no la ha oído. Reacciones, la historia detrás de la letra, versión acústica, alguien bailándola. El lanzamiento no se acaba el día 0.",
    phase: "SOSTENER",
    day: 3,
    channel: "TikTok",
  },
  {
    key: "playlists-check",
    title: "Revisar en qué playlists has entrado",
    detail:
      "Spotify for Artists → Playlists. Da las gracias públicamente a quien te ha metido: es la forma más barata de que te vuelvan a incluir en el siguiente. Anota cuáles funcionaron para escribirles antes la próxima vez.",
    phase: "SOSTENER",
    day: 7,
    channel: "Spotify",
  },
  {
    key: "reciclar",
    title: "Reciclar el clip con mejor retención",
    detail:
      "Vuelve a publicarlo con otro texto o gancho. En TikTok republicar funciona: cada publicación se prueba con una audiencia distinta. Elige por retención media, no por likes.",
    phase: "SOSTENER",
    day: 14,
    channel: "TikTok",
  },
  {
    key: "balance",
    title: "Hacer el balance del lanzamiento",
    detail:
      "Qué clip funcionó, qué anuncio tuvo mejor coste por clic, qué playlists entraron, cuánto costó cada oyente. Guárdalo: el siguiente lanzamiento empieza aquí y no en la casilla de salida.",
    phase: "SOSTENER",
    day: 28,
    channel: "Análisis",
  },
];

/** Activos de contenido que hay que fabricar, con sus especificaciones. */
export const CONTENT_ASSETS = [
  {
    name: "Portada",
    spec: "3000×3000 px · JPG/PNG · sin texto promocional",
    why: "La rechazan si lleva URLs, logos de redes o «nuevo single».",
  },
  {
    name: "Clips verticales",
    spec: "9:16 · 1080×1920 · 10-15 piezas",
    why: "Es el volumen mínimo para aguantar una campaña sin repetirte.",
  },
  {
    name: "Canvas de Spotify",
    spec: "9:16 · 3-8 s · en bucle · sin texto",
    why: "Sube compartidos y guardados dentro de la propia app.",
  },
  {
    name: "Lyric video",
    spec: "16:9 · 1080p · letra completa en la descripción",
    why: "Te posiciona en las búsquedas de trozos de la letra.",
  },
  {
    name: "Fotos de prensa",
    spec: "3 verticales + 2 horizontales · alta resolución",
    why: "Playlists y blogs las piden y sin ellas se cae la publicación.",
  },
  {
    name: "Enlace de pre-guardado",
    spec: "Un enlace para todas las plataformas",
    why: "Cada pre-guardado es una reproducción el día 1.",
  },
];

/** Guía de anuncios: qué campaña montar en cada momento y con qué público. */
export const AD_PLAYBOOK = [
  {
    phase: "Antes del lanzamiento",
    objective: "Tráfico",
    audience: "Solo público cálido: seguidores y quien ya interactuó con tus vídeos.",
    budget: "5 €/día · 5 días",
    destination: "Enlace de pre-guardado",
    warning:
      "A público frío todavía no. Sale caro y aún no hay nada que escuchar, así que el clic no se convierte.",
  },
  {
    phase: "Semana del lanzamiento",
    objective: "Tráfico",
    audience: "Cálido + un público similar (lookalike) al 1% de quien más te escucha.",
    budget: "8-10 €/día · 10 días",
    destination: "Enlace directo a la plataforma donde más te escuchan",
    warning:
      "Nunca uses el objetivo de interacción: te llena de likes de gente que no va a escuchar nada.",
  },
  {
    phase: "Sostener",
    objective: "Tráfico",
    audience: "Intereses por artistas parecidos, en el país donde mejor te funcione.",
    budget: "5 €/día mientras el coste por clic aguante por debajo de 0,15 €",
    destination: "Enlace directo a la canción",
    warning:
      "En cuanto el coste por clic se dispare, corta. Alargar una campaña que ya no rinde es donde se va el dinero.",
  },
];

export function stepsForPhase(phase: PhaseId) {
  return LAUNCH_STEPS.filter((s) => s.phase === phase);
}

/** Fecha real de cada paso a partir de la fecha aproximada de lanzamiento. */
export function dateForStep(release: Date, day: number): Date {
  const d = new Date(release);
  d.setDate(d.getDate() + day);
  return d;
}

/** En qué fase de la campaña está una canción según los días que faltan. */
export function currentPhase(daysToRelease: number | null): PhaseId | null {
  if (daysToRelease === null) return null;
  if (daysToRelease > 35) return "FUNDAMENTOS";
  if (daysToRelease > 21) return "ACTIVOS";
  if (daysToRelease > 7) return "CALENTAMIENTO";
  if (daysToRelease > 0) return "CUENTA_ATRAS";
  if (daysToRelease === 0) return "SALIDA";
  return "SOSTENER";
}
