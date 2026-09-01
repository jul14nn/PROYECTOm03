/**
 * Dibujo y miniaturas del vídeo de origen.
 *
 * El editor necesita dos cosas del vídeo además de grabarlo: pintar el
 * fotograma actual en la previsualización, y sacar la tira de miniaturas de
 * la línea de tiempo.
 */

/** Recorte "cover": llena la caja sin deformar, recortando lo que sobra. */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  v: HTMLVideoElement,
  w: number,
  h: number
) {
  const vw = v.videoWidth;
  const vh = v.videoHeight;
  if (!vw || !vh) return;
  const escala = Math.max(w / vw, h / vh);
  const sw = w / escala;
  const sh = h / escala;
  ctx.drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, w, h);
}

/** Lleva el vídeo a un instante y espera a que el fotograma esté listo. */
export function seek(v: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(v.currentTime - t) < 0.01) return resolve();
    const listo = () => {
      v.removeEventListener("seeked", listo);
      resolve();
    };
    v.addEventListener("seeked", listo);
    v.currentTime = t;
  });
}

/**
 * Tira de miniaturas repartidas por todo el vídeo.
 *
 * Devuelve [] si el lienzo queda "contaminado": pasa cuando el vídeo viene de
 * otro dominio sin permiso CORS, y en ese caso `toDataURL` lanza. No es
 * motivo para romper el editor, así que la línea de tiempo se dibuja sin
 * miniaturas y ya está.
 */
export async function extractThumbnails(
  v: HTMLVideoElement,
  n = 12
): Promise<string[]> {
  if (!v.duration || !Number.isFinite(v.duration)) return [];
  const c = document.createElement("canvas");
  c.width = 72;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) return [];

  const anterior = v.currentTime;
  const fuera: string[] = [];
  try {
    for (let i = 0; i < n; i++) {
      await seek(v, (v.duration * (i + 0.5)) / n);
      drawCover(ctx, v, c.width, c.height);
      fuera.push(c.toDataURL("image/jpeg", 0.5));
    }
  } catch {
    return [];
  } finally {
    await seek(v, anterior).catch(() => {});
  }
  return fuera;
}
