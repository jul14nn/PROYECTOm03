/**
 * Plantillas de subtítulo pensadas para ser sutiles: legibles sobre cualquier
 * imagen sin comerse el vídeo. Nada de karaoke amarillo con borde grueso.
 */

export type SubtitleStyleId = "limpio" | "barra" | "linea" | "bloque";

export type SubtitleStyle = {
  id: SubtitleStyleId;
  name: string;
  description: string;
};

export const SUBTITLE_STYLES: SubtitleStyle[] = [
  {
    id: "limpio",
    name: "Limpio",
    description: "Texto blanco con una sombra suave. Lo más discreto.",
  },
  {
    id: "barra",
    name: "Barra",
    description: "Franja translúcida detrás del texto. El más legible sobre vídeo movido.",
  },
  {
    id: "linea",
    name: "Subrayado",
    description: "Texto con una línea fina del color de la canción debajo.",
  },
  {
    id: "bloque",
    name: "Bloque",
    description: "Cada línea sobre su propio rectángulo ajustado al texto.",
  },
];

export type SubtitleLine = { text: string; start: number; end: number };

export type SubtitleOptions = {
  style: SubtitleStyleId;
  /** Color de acento, normalmente el de la canción. */
  accent: string;
  /** Familia tipográfica del kit de marca. */
  fontFamily: string;
  /** Posición vertical en % de la altura, para respetar la zona segura. */
  positionPct: number;
  /** Tamaño relativo, 1 = por defecto. */
  scale: number;
};

/** Parte una línea en varias si no cabe en el ancho disponible. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = current + " " + words[i];
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

/**
 * Dibuja el subtítulo activo en el instante `time` (segundos).
 * Se llama en cada fotograma, después del fondo y antes de nada más.
 */
export function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  lines: SubtitleLine[],
  time: number,
  opts: SubtitleOptions
) {
  const active = lines.find((l) => time >= l.start && time < l.end);
  if (!active || !active.text.trim()) return;

  const fontSize = Math.round(W * 0.062 * opts.scale);
  const padX = Math.round(W * 0.045);
  const maxWidth = W - padX * 2;

  ctx.save();
  ctx.font = `600 ${fontSize}px ${opts.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const wrapped = wrap(ctx, active.text, maxWidth);
  const lineHeight = Math.round(fontSize * 1.28);
  const blockHeight = wrapped.length * lineHeight;
  const centerY = H * (opts.positionPct / 100);
  let y = centerY - blockHeight / 2 + lineHeight / 2;

  // Aparición suave: los 180 ms iniciales de cada línea.
  const fade = Math.min(1, (time - active.start) / 0.18);
  ctx.globalAlpha = fade;

  if (opts.style === "barra") {
    const top = centerY - blockHeight / 2 - fontSize * 0.42;
    const height = blockHeight + fontSize * 0.84;
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(0, top, W, height);
  }

  for (const line of wrapped) {
    const width = ctx.measureText(line).width;

    if (opts.style === "bloque") {
      const bw = width + fontSize * 0.7;
      const bh = lineHeight * 0.92;
      ctx.fillStyle = "rgba(0,0,0,0.62)";
      ctx.beginPath();
      ctx.roundRect(W / 2 - bw / 2, y - bh / 2, bw, bh, fontSize * 0.16);
      ctx.fill();
    }

    if (opts.style === "limpio" || opts.style === "linea") {
      ctx.shadowColor = "rgba(0,0,0,0.75)";
      ctx.shadowBlur = fontSize * 0.32;
      ctx.shadowOffsetY = Math.round(fontSize * 0.04);
    } else {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillText(line, W / 2, y);

    if (opts.style === "linea") {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.fillStyle = opts.accent;
      const uw = Math.min(width, maxWidth);
      ctx.fillRect(
        W / 2 - uw / 2,
        y + fontSize * 0.62,
        uw,
        Math.max(2, Math.round(fontSize * 0.055))
      );
    }

    y += lineHeight;
  }

  ctx.restore();
}

/**
 * Reparte automáticamente las líneas a lo largo de la duración, como punto de
 * partida antes de afinar los tiempos a mano.
 */
export function autoTime(texts: string[], duration: number): SubtitleLine[] {
  const clean = texts.map((t) => t.trim()).filter(Boolean);
  if (clean.length === 0) return [];
  const slot = duration / clean.length;
  return clean.map((text, i) => ({
    text,
    start: +(i * slot).toFixed(2),
    end: +((i + 1) * slot).toFixed(2),
  }));
}
