"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Film, Loader2, Monitor, Save, Upload, Wand2 } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { checkVideoSupport, type VideoSupport } from "@/lib/videoCodec";
import { drawSubtitle, type SubtitleLine, type SubtitleStyleId } from "@/lib/subtitleStyles";
import SubtitleEditor from "@/components/SubtitleEditor";
import type { BrandKitValues } from "@/components/VideoGenerator";

const W = 720;
const H = 1280;
const MAX_MB = 200;

/** Recorta el vídeo a vertical llenando el lienzo sin deformarlo. */
function drawCover(ctx: CanvasRenderingContext2D, v: HTMLVideoElement) {
  const scale = Math.max(W / v.videoWidth, H / v.videoHeight);
  const sw = W / scale;
  const sh = H / scale;
  ctx.drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, 0, 0, W, H);
}

/**
 * Estudio de clips: coges un vídeo de tu ordenador, le pones subtítulos y
 * sale un MP4 vertical listo para publicar.
 *
 * El archivo NO se sube para trabajarlo: se lee en local con un object URL,
 * así que no hay espera de subida, ni consumo de almacenamiento, ni problema
 * de permisos de origen al dibujarlo en el lienzo. Solo se sube el resultado
 * si decides guardarlo, y en ese caso va directo al almacenamiento.
 */
export default function ClipStudio({
  songId,
  songTitle,
  songColor,
  brand,
  uploadEnabled,
}: {
  songId: string;
  songTitle: string;
  songColor: string;
  brand: BrandKitValues;
  uploadEnabled: boolean;
}) {
  const [support, setSupport] = useState<VideoSupport | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [clipDuration, setClipDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [length, setLength] = useState(8);
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const [subStyle, setSubStyle] = useState<SubtitleStyleId>(brand.subtitleStyle);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupport(checkVideoSupport());
  }, []);

  // Los object URL ocupan memoria hasta que se liberan a mano.
  useEffect(() => {
    return () => {
      if (srcUrl) URL.revokeObjectURL(srcUrl);
    };
  }, [srcUrl]);

  function pickFile(f: File | null) {
    setError(null);
    setOutUrl(null);
    setOutBlob(null);
    setSaved(false);
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`El clip pesa ${(f.size / 1024 / 1024).toFixed(0)} MB. El máximo es ${MAX_MB} MB.`);
      return;
    }
    if (srcUrl) URL.revokeObjectURL(srcUrl);
    setFile(f);
    setSrcUrl(URL.createObjectURL(f));
    setStart(0);
  }

  const maxLength = clipDuration > 0 ? Math.min(15, Math.max(1, clipDuration - start)) : 15;
  const effectiveLength = Math.min(length, maxLength);

  async function handleRender() {
    if (!support?.ok || !videoRef.current || !canvasRef.current) return;
    setError(null);
    setOutUrl(null);
    setOutBlob(null);
    setSaved(false);
    setRendering(true);
    setProgress(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    try {
      await document.fonts.ready;

      // Colocar el cabezal y esperar a que el fotograma esté listo de verdad.
      video.pause();
      video.currentTime = start;
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
      });

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
      await video.play();

      await new Promise<void>((resolve) => {
        function loop() {
          const elapsed = video.currentTime - start;
          if (video.ended || elapsed >= effectiveLength) {
            resolve();
            return;
          }
          drawCover(ctx, video);
          if (lines.length > 0) {
            drawSubtitle(ctx, W, H, lines, elapsed, {
              style: subStyle,
              accent: songColor,
              fontFamily: `${brand.fontFamily}, Arial, sans-serif`,
              positionPct: brand.subtitlePosPct,
              scale: brand.subtitleScale,
            });
          }
          setProgress(Math.round(Math.min(1, elapsed / effectiveLength) * 100));
          requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
      });

      video.pause();
      recorder.stop();
      await done;

      const blob = new Blob(chunks, { type: mime || `video/${ext}` });
      setOutBlob(blob);
      setOutUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(
        err instanceof Error ? `No se pudo montar el clip: ${err.message}` : "No se pudo montar el clip."
      );
    } finally {
      setRendering(false);
    }
  }

  const ext = support?.ok ? support.format.ext : "webm";
  const outName = `${songTitle}-clip.${ext}`;

  async function handleSave() {
    if (!outBlob) return;
    setSaving(true);
    setError(null);
    try {
      // Subida directa: el archivo no pasa por la función de servidor, que
      // corta las peticiones a 4,5 MB.
      await upload(`songs/${songId}/${crypto.randomUUID()}-clip.${ext}`, outBlob, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        contentType: outBlob.type,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el clip.");
    } finally {
      setSaving(false);
    }
  }

  if (support === null) {
    return <p className="text-sm text-neutral-500">Comprobando el navegador…</p>;
  }

  if (!support.ok) {
    return (
      <div className="tile p-5 flex items-start gap-3">
        <Monitor size={18} className="text-fuchsia-300 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">El montaje de clips se hace desde el ordenador</p>
          <p className="text-sm text-neutral-400 mt-1.5 max-w-lg">
            {support.reason} Abre esta canción desde un ordenador para montar tus
            clips con subtítulos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Coge un clip de tu ordenador, ponle los subtítulos y sácalo en vertical
        listo para publicar. El clip se trabaja en tu propio navegador: no se
        sube nada mientras editas.
      </p>

      <label className="tile p-5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.06] transition-colors">
        <Upload size={20} className="text-fuchsia-300 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">
            {file ? file.name : "Elegir un clip de vídeo"}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            {file
              ? `${(file.size / 1024 / 1024).toFixed(1)} MB${clipDuration ? ` · ${clipDuration.toFixed(1)}s` : ""}`
              : `MP4, MOV o WebM · hasta ${MAX_MB} MB`}
          </div>
        </div>
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {srcUrl && (
        <>
          <video
            ref={videoRef}
            src={srcUrl}
            muted
            playsInline
            preload="auto"
            className="hidden"
            onLoadedMetadata={(e) => setClipDuration(e.currentTarget.duration)}
          />

          <div className="tile p-4 space-y-4">
            <div>
              <label className="label" htmlFor="clip-start">
                Empezar en {start.toFixed(1)}s
              </label>
              <input
                id="clip-start"
                type="range"
                min={0}
                max={Math.max(0, clipDuration - 1)}
                step={0.1}
                value={start}
                onChange={(e) => setStart(Number(e.target.value))}
                className="w-full accent-fuchsia-500"
              />
            </div>
            <div>
              <label className="label" htmlFor="clip-length">
                Duración
              </label>
              <select
                id="clip-length"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="input w-32"
              >
                {[6, 8, 12, 15].map((n) => (
                  <option key={n} value={n} disabled={n > maxLength}>
                    {n} s
                  </option>
                ))}
              </select>
              {effectiveLength < length && (
                <p className="text-xs text-amber-300/80 mt-1.5">
                  El clip solo da para {effectiveLength.toFixed(1)}s desde ese punto.
                </p>
              )}
            </div>
          </div>

          <SubtitleEditor
            duration={effectiveLength}
            lines={lines}
            setLines={setLines}
            style={subStyle}
            setStyle={setSubStyle}
            defaultOpen
          />

          <button
            type="button"
            onClick={handleRender}
            disabled={rendering}
            className="btn btn-primary"
          >
            {rendering ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
            {rendering ? `Montando… ${progress}%` : "Montar el clip"}
          </button>

          {rendering && (
            <p className="text-xs text-neutral-500">
              Se graba en tiempo real, así que tarda lo que dura el clip. No cambies
              de pestaña o se perderán fotogramas.
            </p>
          )}
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {error && <p className="text-sm text-red-400">{error}</p>}

      {outUrl && (
        <>
          <div className="rounded-lg overflow-hidden border border-white/[0.07] bg-black max-w-[220px]">
            <video src={outUrl} controls loop className="w-full h-full" />
          </div>
          <p className="text-xs text-neutral-600">
            El clip sale sin audio a propósito: para promoción, el sonido lo pones
            en TikTok o Reels con tu canción, que además es lo que hace que la
            gente la encuentre.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={outUrl} download={outName} className="btn btn-secondary">
              <Download size={14} /> Descargar {ext.toUpperCase()}
            </a>
            {uploadEnabled && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || saved}
                className="btn btn-secondary"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saved ? "Guardado en Referencias" : "Guardar en Referencias"}
              </button>
            )}
          </div>
          {saved && (
            <p className="text-xs text-neutral-500">
              Recarga la página para verlo en Referencias.
            </p>
          )}
        </>
      )}

      {!srcUrl && (
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <Film size={14} /> Nada sale de tu ordenador hasta que pulses guardar.
        </div>
      )}
    </div>
  );
}
