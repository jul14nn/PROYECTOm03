/**
 * Elección de formato de salida para MediaRecorder.
 *
 * La versión anterior asumía WebM y le pasaba "video/webm" al constructor
 * aunque no estuviera soportado, con lo que en Safari (que graba en MP4)
 * lanzaba excepción y el generador no funcionaba.
 *
 * Además el orden importa por destino, no por calidad: TikTok e Instagram
 * quieren MP4/H.264, así que se prefiere aunque haya WebM disponible.
 */

const CANDIDATES = [
  { mime: "video/mp4;codecs=avc1.42E01E", ext: "mp4" },
  { mime: "video/mp4;codecs=h264", ext: "mp4" },
  { mime: "video/mp4", ext: "mp4" },
  { mime: "video/webm;codecs=vp9", ext: "webm" },
  { mime: "video/webm;codecs=vp8", ext: "webm" },
  { mime: "video/webm", ext: "webm" },
] as const;

export type RecordingFormat = { mime: string; ext: string };

/** El mejor formato disponible, o null si el navegador no puede grabar. */
export function pickRecordingFormat(): RecordingFormat | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const c of CANDIDATES) {
    if (MediaRecorder.isTypeSupported(c.mime)) return { mime: c.mime, ext: c.ext };
  }
  // Algunos navegadores graban con las opciones por defecto aunque digan que
  // no soportan ningún mimeType concreto; se deja intentarlo sin especificar.
  return { mime: "", ext: "webm" };
}

export type VideoSupport =
  | { ok: true; format: RecordingFormat; warnWebm: boolean }
  | { ok: false; reason: string };

/**
 * Comprueba de verdad si este navegador puede montar vídeo, mirando las APIs
 * que hacen falta en lugar de adivinar por el user-agent.
 */
export function checkVideoSupport(): VideoSupport {
  if (typeof window === "undefined") {
    return { ok: false, reason: "Comprobando…" };
  }
  if (typeof MediaRecorder === "undefined") {
    return {
      ok: false,
      reason: "Este navegador no puede grabar vídeo (no tiene MediaRecorder).",
    };
  }
  const canvas = document.createElement("canvas");
  if (typeof canvas.captureStream !== "function") {
    return {
      ok: false,
      reason: "Este navegador no permite capturar el lienzo para grabarlo.",
    };
  }
  const format = pickRecordingFormat();
  if (!format) {
    return { ok: false, reason: "No hay ningún formato de vídeo disponible." };
  }
  return { ok: true, format, warnWebm: format.ext === "webm" };
}
