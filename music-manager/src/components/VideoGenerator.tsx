"use client";

import { useEffect, useRef, useState } from "react";
import { Wand2, Download, Save, Loader2, Film, Monitor } from "lucide-react";
import clsx from "clsx";
import { VIDEO_STYLES, hexToRgb, type VideoStyleId } from "@/lib/videoStyles";
import { addSongReference } from "@/lib/actions/references";
import { BUILTIN_FONTS, resolveFontFamily } from "@/lib/loadFont";
import { checkVideoSupport, type VideoSupport } from "@/lib/videoCodec";
import {
  drawSubtitle,
  type SubtitleStyleId,
  type SubtitleLine,
  type SubtitleOptions,
} from "@/lib/subtitleStyles";
import SubtitleEditor from "@/components/SubtitleEditor";

const W = 720;
const H = 1280;

async function loadImages(urls: string[]): Promise<HTMLImageElement[]> {
  const results = await Promise.allSettled(
    urls.map(
      (url) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        })
    )
  );
  return results.filter((r): r is PromiseFulfilledResult<HTMLImageElement> => r.status === "fulfilled").map((r) => r.value);
}

function drawCoverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  opts: { y: number; size: number; color: string; align?: CanvasTextAlign; glow?: string; stroke?: string }
) {
  ctx.save();
  ctx.font = `900 ${opts.size}px Anton, Arial, sans-serif`;
  ctx.textAlign = opts.align ?? "center";
  ctx.textBaseline = "alphabetic";
  const x = opts.align === "left" ? 48 : W / 2;
  if (opts.glow) {
    ctx.shadowColor = opts.glow;
    ctx.shadowBlur = 40;
  }
  if (opts.stroke) {
    ctx.lineWidth = 6;
    ctx.strokeStyle = opts.stroke;
    ctx.strokeText(title.toUpperCase(), x, opts.y);
  }
  ctx.fillStyle = opts.color;
  ctx.fillText(title.toUpperCase(), x, opts.y);
  ctx.restore();
}

function drawFrame(
  style: VideoStyleId,
  ctx: CanvasRenderingContext2D,
  t: number, // 0..1 progreso total
  images: HTMLImageElement[],
  title: string,
  color: string
) {
  const [r, g, b] = hexToRgb(color);
  ctx.clearRect(0, 0, W, H);

  if (style === "neon") {
    ctx.fillStyle = "#050308";
    ctx.fillRect(0, 0, W, H);
    const blobs: [string, number, number][] = [
      ["#9333ea", 0.25, 0.2],
      ["#e0299e", 0.8, 0.35],
      ["#f6a723", 0.5, 0.9],
    ];
    for (const [c, bx, by] of blobs) {
      const cx = W * bx + Math.sin(t * Math.PI * 2 + bx * 10) * 60;
      const cy = H * by + Math.cos(t * Math.PI * 2 + by * 10) * 60;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 420);
      grad.addColorStop(0, `${c}aa`);
      grad.addColorStop(1, `${c}00`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }
    if (images.length > 0) {
      const slot = 1 / images.length;
      const idx = Math.min(images.length - 1, Math.floor(t / slot));
      const localT = (t - idx * slot) / slot;
      ctx.save();
      ctx.globalAlpha = 0.9;
      const size = 460;
      const x = (W - size) / 2;
      const y = H * 0.28 + Math.sin(localT * Math.PI) * -10;
      ctx.beginPath();
      const radius = 24;
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + size, y, x + size, y + size, radius);
      ctx.arcTo(x + size, y + size, x, y + size, radius);
      ctx.arcTo(x, y + size, x, y, radius);
      ctx.arcTo(x, y, x + size, y, radius);
      ctx.closePath();
      ctx.clip();
      drawCoverImage(ctx, images[idx], x, y, size, size);
      ctx.restore();
    }
    drawTitle(ctx, title, { y: H * 0.85, size: 76, color: "#ffffff", glow: "#e0299e" });
  }

  if (style === "poster") {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    if (images.length > 0) {
      const slot = 1 / images.length;
      const idx = Math.min(images.length - 1, Math.floor(t / slot));
      ctx.save();
      ctx.globalAlpha = 0.75;
      drawCoverImage(ctx, images[idx], 0, 0, W, H);
      ctx.restore();
    }
    const grad = ctx.createLinearGradient(0, H * 0.5, 0, H);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.85)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, H * 0.5, W, H * 0.5);
    const borderWidth = 14 + Math.sin(t * Math.PI * 6) * 4;
    ctx.strokeStyle = color;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, W - borderWidth, H - borderWidth);
    drawTitle(ctx, title, { y: H * 0.88, size: 88, color: "#ffffff", stroke: color });
  }

  if (style === "minimal") {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `rgb(${r},${g},${b})`);
    grad.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    if (images.length > 0) {
      const img = images[0];
      const zoom = 1 + t * 0.08;
      const size = 520 * zoom;
      ctx.save();
      ctx.globalAlpha = 0.92;
      const x = (W - size) / 2;
      const y = (H - size) / 2 - 60;
      ctx.beginPath();
      ctx.arc(W / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      drawCoverImage(ctx, img, x, y, size, size);
      ctx.restore();
    }
    drawTitle(ctx, title, { y: H * 0.82, size: 64, color: "#ffffff" });
  }

  if (style === "waves") {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    const bars = 24;
    const barW = W / bars;
    for (let i = 0; i < bars; i++) {
      const phase = i * 0.6;
      const amp = 120 + 100 * Math.sin(t * Math.PI * 4 + phase * 0.3);
      const barH = Math.abs(Math.sin(t * Math.PI * 3 + phase)) * amp + 40;
      ctx.fillStyle = `rgba(${r},${g},${b},${0.5 + 0.5 * Math.sin(phase)})`;
      ctx.fillRect(i * barW + 4, H / 2 - barH / 2, barW - 8, barH);
    }
    drawTitle(ctx, title, { y: H * 0.85, size: 60, color: "#ffffff" });
  }

  if (style === "slideshow") {
    ctx.fillStyle = "#111114";
    ctx.fillRect(0, 0, W, H);
    if (images.length > 0) {
      const slot = 1 / images.length;
      const rawIdx = t / slot;
      const idx = Math.min(images.length - 1, Math.floor(rawIdx));
      const nextIdx = Math.min(images.length - 1, idx + 1);
      const localT = rawIdx - idx;
      const fade = Math.min(1, localT / 0.25);
      ctx.save();
      ctx.globalAlpha = 1;
      drawCoverImage(ctx, images[idx], 0, H * 0.12, W, H * 0.62);
      if (nextIdx !== idx && fade > 0) {
        ctx.globalAlpha = fade;
        drawCoverImage(ctx, images[nextIdx], 0, H * 0.12, W, H * 0.62);
      }
      ctx.restore();
    }
    drawTitle(ctx, title, { y: H * 0.85, size: 52, color: "#ffffff", align: "left" });
  }
}


export type BrandKitValues = {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  subtitleStyle: SubtitleStyleId;
  subtitlePosPct: number;
  subtitleScale: number;
  defaultVideoStyle: string;
};

export default function VideoGenerator({
  songId,
  songTitle,
  songColor,
  images,
  brand,
  initialLyrics,
}: {
  songId: string;
  songTitle: string;
  songColor: string;
  images: { url: string }[];
  brand: BrandKitValues;
  initialLyrics?: string | null;
}) {
  const [styleId, setStyleId] = useState<VideoStyleId>(
    (VIDEO_STYLES.some((s) => s.id === brand.defaultVideoStyle)
      ? brand.defaultVideoStyle
      : "neon") as VideoStyleId
  );
  const [duration, setDuration] = useState(8);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [support, setSupport] = useState<VideoSupport | null>(null);

  // Subtítulos
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const [subStyle, setSubStyle] = useState<SubtitleStyleId>(brand.subtitleStyle);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const style = VIDEO_STYLES.find((s) => s.id === styleId)!;

  useEffect(() => {
    // Comprobación real de capacidades del navegador; no se puede hacer en el
    // servidor porque depende de las APIs del cliente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupport(checkVideoSupport());
  }, []);

  // La familia hay que resolverla: el nombre guardado es un identificador
  // ("montserrat"), no algo que el lienzo entienda, y además la fuente puede
  // no estar descargada todavía.
  const [brandFont, setBrandFont] = useState("sans-serif");
  useEffect(() => {
    let vigente = true;
    const opcion =
      BUILTIN_FONTS.find((f) => f.id === brand.fontFamily) ?? BUILTIN_FONTS[0];
    resolveFontFamily(opcion)
      .then((f) => {
        if (vigente) setBrandFont(f);
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [brand.fontFamily]);

  const subOpts: SubtitleOptions = {
    style: subStyle,
    accent: songColor,
    fontFamily: brandFont,
    positionPct: brand.subtitlePosPct,
    scale: brand.subtitleScale,
  };

  async function handleGenerate() {
    if (!support?.ok) return;
    setError(null);
    setVideoUrl(null);
    setVideoBlob(null);
    setSaved(false);
    setGenerating(true);
    setProgress(0);

    try {
      const canvas = canvasRef.current!;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      await document.fonts.ready;
      const imgs = style.usesImages ? await loadImages(images.map((i) => i.url)) : [];

      const stream = canvas.captureStream(30);
      const { mime, ext } = support.format;
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const done = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.start();
      const start = performance.now();
      await new Promise<void>((resolve) => {
        function loop() {
          const seconds = (performance.now() - start) / 1000;
          const t = Math.min(1, seconds / duration);
          drawFrame(styleId, ctx, t, imgs, songTitle, songColor);
          if (lines.length > 0) drawSubtitle(ctx, W, H, lines, seconds, subOpts);
          setProgress(Math.round(t * 100));
          if (t < 1) requestAnimationFrame(loop);
          else resolve();
        }
        requestAnimationFrame(loop);
      });
      recorder.stop();
      await done;

      const blob = new Blob(chunks, { type: mime || `video/${ext}` });
      setVideoBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(
        err instanceof Error
          ? `No se pudo generar el vídeo: ${err.message}`
          : "No se pudo generar el vídeo."
      );
    } finally {
      setGenerating(false);
    }
  }

  const ext = support?.ok ? support.format.ext : "webm";
  const fileName = `${songTitle}-${styleId}.${ext}`;

  async function handleSave() {
    if (!videoBlob) return;
    setSaving(true);
    try {
      const file = new File([videoBlob], fileName, { type: videoBlob.type });
      const fd = new FormData();
      fd.set("file", file);
      fd.set("caption", `Vídeo generado — ${style.name}`);
      await addSongReference(songId, fd);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el vídeo.");
    } finally {
      setSaving(false);
    }
  }

  if (support === null) {
    return <p className="text-sm text-neutral-500">Comprobando el navegador…</p>;
  }

  // El montaje de vídeo se hace desde ordenador a propósito: grabar el lienzo
  // en tiempo real es poco fiable en móvil y el formato de salida no siempre
  // sirve para subir a TikTok o Instagram.
  if (!support.ok) {
    return (
      <div className="tile p-5 flex items-start gap-3">
        <Monitor size={18} className="text-fuchsia-300 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">El montaje de vídeo se hace desde el ordenador</p>
          <p className="text-sm text-neutral-400 mt-1.5 max-w-lg">
            {support.reason} Grabar vídeo en el móvil da tirones y un formato que
            luego no puedes subir. Abre esta misma canción desde un ordenador y
            aquí tendrás el generador con sus plantillas de subtítulos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Elige un estilo y genera un vídeo vertical listo para TikTok o Reels a partir
        de tus imágenes de referencia. Se genera en tu navegador: no sale de tu
        ordenador hasta que decidas guardarlo.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {VIDEO_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStyleId(s.id)}
            className={clsx(
              "text-left rounded-lg p-3 border transition-colors",
              styleId === s.id ? "border-fuchsia-500/60 bg-fuchsia-500/10" : "tile"
            )}
          >
            <div className="text-sm font-medium">{s.name}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{s.description}</div>
          </button>
        ))}
      </div>

      <SubtitleEditor
        initialText={initialLyrics}
        duration={duration}
        lines={lines}
        setLines={setLines}
        style={subStyle}
        setStyle={setSubStyle}
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-neutral-400 flex items-center gap-2">
          Duración
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="input w-24 py-1"
          >
            <option value={6}>6 s</option>
            <option value={8}>8 s</option>
            <option value={12}>12 s</option>
          </select>
        </label>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="btn btn-primary"
        >
          {generating ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          {generating ? `Generando… ${progress}%` : "Generar vídeo"}
        </button>
      </div>

      {style.usesImages && images.length === 0 && (
        <p className="text-xs text-neutral-600">
          Este estilo usa tus imágenes de referencia — sin ninguna subida, se genera igual con solo color y título.
        </p>
      )}

      {support.warnWebm && (
        <p className="text-xs text-amber-300/80">
          Este navegador solo graba en WebM. TikTok e Instagram prefieren MP4:
          para publicar, genera desde Chrome o Edge.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <canvas ref={canvasRef} className="hidden" />

      {videoUrl && (
        <div className="rounded-lg overflow-hidden border border-white/[0.07] bg-black max-w-[220px]">
          <video src={videoUrl} controls loop className="w-full h-full" />
        </div>
      )}

      {videoUrl && videoBlob && (
        <div className="flex flex-wrap gap-2">
          <a href={videoUrl} download={fileName} className="btn btn-secondary">
            <Download size={14} /> Descargar {ext.toUpperCase()}
          </a>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            className="btn btn-secondary"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saved ? "Guardado en Referencias" : "Guardar en Referencias"}
          </button>
        </div>
      )}

      {!videoUrl && !generating && (
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <Film size={14} /> El vídeo se genera en tu propio navegador — no sale de tu dispositivo hasta que lo guardes.
        </div>
      )}
    </div>
  );
}
