export type AssetKind = "AUDIO" | "VIDEO" | "FONT";

export const ASSET_RULES = {
  AUDIO: {
    label: "Audio",
    // WAV pesa mucho pero es lo que sale de un DAW sin exportar aparte.
    mimeTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/aac", "audio/ogg"],
    extensions: ".mp3,.wav,.m4a,.aac,.ogg",
    maxBytes: 60 * 1024 * 1024,
    hint: "MP3, WAV, M4A · hasta 60 MB",
  },
  VIDEO: {
    label: "Vídeo",
    mimeTypes: ["video/mp4", "video/quicktime", "video/webm"],
    extensions: ".mp4,.mov,.webm",
    maxBytes: 200 * 1024 * 1024,
    hint: "MP4, MOV, WebM · hasta 200 MB",
  },
  FONT: {
    // WOFF2 es lo que mejor carga; TTF y OTF también valen.
    mimeTypes: [
      "font/woff2",
      "font/woff",
      "font/ttf",
      "font/otf",
      "application/font-woff",
      "application/x-font-ttf",
      "application/octet-stream",
    ],
    label: "Tipografía",
    extensions: ".woff2,.woff,.ttf,.otf",
    maxBytes: 5 * 1024 * 1024,
    hint: "WOFF2, WOFF, TTF, OTF · hasta 5 MB",
  },
} as const;

export function isAssetKind(v: unknown): v is AssetKind {
  return v === "AUDIO" || v === "VIDEO" || v === "FONT";
}

export function formatBytes(n: number) {
  if (!n) return "—";
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Nombre de familia con el que se registra una fuente subida.
 * Se deriva del id para que no choque con otra que se llame igual.
 */
export function fontFamilyName(assetId: string) {
  return `mm-font-${assetId}`;
}
