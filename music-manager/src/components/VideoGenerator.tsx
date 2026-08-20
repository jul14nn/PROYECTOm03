"use client";

import { useRef, useState } from "react";
import { Wand2, Download, Save, Loader2, Film } from "lucide-react";
import clsx from "clsx";
import { VIDEO_STYLES, hexToRgb, type VideoStyleId } from "@/lib/videoStyles";
import { addSongReference } from "@/lib/actions/references";

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

export default function VideoGenerator({
  songId,
  songTitle,
  songColor,
  images,
}: {
  songId: string;
  songTitle: string;
  songColor: string;
  images: { url: string }[];
}) {
  const [styleId, setStyleId] = useState<VideoStyleId>("neon");
  const [duration, setDuration] = useState(8);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const style = VIDEO_STYLES.find((s) => s.id === styleId)!;

  async function handleGenerate() {
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
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
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
          const elapsed = (performance.now() - start) / 1000;
          const t = Math.min(1, elapsed / duration);
          drawFrame(styleId, ctx, t, imgs, songTitle, songColor);
          setProgress(Math.round(t * 100));
          if (t < 1) {
            requestAnimationFrame(loop);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(loop);
      });
      recorder.stop();
      await done;

      const blob = new Blob(chunks, { type: "video/webm" });
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

  async function handleSave() {
    if (!videoBlob) return;
    setSaving(true);
    try {
      const file = new File([videoBlob], `${songTitle}-${styleId}.webm`, { type: "video/webm" });
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

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {VIDEO_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStyleId(s.id)}
            className={clsx(
              "text-left rounded-lg p-3 border transition-colors",
              styleId === s.id ? "border-fuchsia-500/60 bg-fuchsia-500/10" : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
            )}
          >
            <div className="text-sm font-medium">{s.name}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{s.description}</div>
          </button>
        ))}
      </div>

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
        <button type="button" onClick={handleGenerate} disabled={generating} className="btn btn-primary">
          {generating ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          {generating ? `Generando… ${progress}%` : "Generar vídeo"}
        </button>
      </div>

      {style.usesImages && images.length === 0 && (
        <p className="text-xs text-neutral-600">
          Este estilo usa tus imágenes de referencia — sin ninguna subida, se genera igual con solo color y título.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <canvas ref={canvasRef} className="hidden" />

      {videoUrl && (
        <div className="rounded-lg overflow-hidden border border-neutral-800 bg-black max-w-[220px]">
          <video src={videoUrl} controls loop className="w-full h-full" />
        </div>
      )}

      {videoUrl && videoBlob && (
        <div className="flex flex-wrap gap-2">
          <a href={videoUrl} download={`${songTitle}-${styleId}.webm`} className="btn btn-secondary">
            <Download size={14} /> Descargar
          </a>
          <button type="button" onClick={handleSave} disabled={saving || saved} className="btn btn-secondary">
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
