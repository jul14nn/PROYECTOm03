"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Film,
  Download,
  Save,
  Loader2,
  Monitor,
  Music,
  Timer,
  Scissors,
} from "lucide-react";
import { checkVideoSupport, type VideoSupport } from "@/lib/videoCodec";
import {
  SUBTITLE_STYLES,
  drawSubtitle,
  autoTime,
  type SubtitleStyleId,
  type SubtitleLine,
} from "@/lib/subtitleStyles";
import { BUILTIN_FONTS, resolveFontFamily, type FontOption } from "@/lib/loadFont";
import { addSongReference } from "@/lib/actions/references";

const W = 720;
const H = 1280;

export type StudioAsset = { id: string; name: string; url: string };

/** Recorte "cover" del vídeo dentro del lienzo vertical. */
function drawCover(ctx: CanvasRenderingContext2D, v: HTMLVideoElement) {
  const vw = v.videoWidth;
  const vh = v.videoHeight;
  if (!vw || !vh) return;
  const scale = Math.max(W / vw, H / vh);
  const sw = W / scale;
  const sh = H / scale;
  ctx.drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, W, H);
}

export default function ClipStudio({
  songId,
  songTitle,
  songColor,
  videos,
  audios,
  fonts,
  defaultSubtitleStyle,
  subtitlePosPct,
  subtitleScale,
}: {
  songId: string;
  songTitle: string;
  songColor: string;
  videos: StudioAsset[];
  audios: StudioAsset[];
  fonts: StudioAsset[];
  defaultSubtitleStyle: SubtitleStyleId;
  subtitlePosPct: number;
  subtitleScale: number;
}) {
  const [support, setSupport] = useState<VideoSupport | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [length, setLength] = useState(10);

  const [rawLines, setRawLines] = useState("");
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const [subStyle, setSubStyle] = useState<SubtitleStyleId>(defaultSubtitleStyle);
  const [fontId, setFontId] = useState<string>(BUILTIN_FONTS[0].id);

  const [syncing, setSyncing] = useState(false);
  const [syncIndex, setSyncIndex] = useState(0);
  const syncMarks = useRef<number[]>([]);
  const syncStart = useRef(0);

  const [rendering, setRendering] = useState(false);
  const [pct, setPct] = useState(0);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const localUrls = useRef<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupport(checkVideoSupport());
  }, []);

  useEffect(() => {
    const urls = localUrls.current;
    // Los object URL de ficheros locales hay que soltarlos al desmontar.
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const fontOptions: FontOption[] = useMemo(
    () => [
      ...BUILTIN_FONTS,
      ...fonts.map((f) => ({ id: f.id, name: f.name, family: "", url: f.url })),
    ],
    [fonts]
  );

  const textLines = rawLines.split("\n").map((l) => l.trim()).filter(Boolean);
  const clipEnd = Math.min(duration || length, start + length);

  function pickLocalVideo(file: File) {
    const url = URL.createObjectURL(file);
    localUrls.current.push(url);
    setVideoUrl(url);
    setVideoName(file.name);
    setOutUrl(null);
    setLines([]);
  }

  function onVideoLoaded() {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    setStart(0);
    setLength(Math.min(10, Math.floor(v.duration) || 10));
  }

  // ---------------------------------------------------------------- sincronía
  function distribute() {
    setLines(autoTime(textLines, length));
  }

  async function startSync() {
    if (textLines.length === 0) return;
    syncMarks.current = [];
    setSyncIndex(0);
    setSyncing(true);
    const a = audioRef.current;
    if (a && audioUrl) {
      a.currentTime = start;
      await a.play().catch(() => {});
    }
    // Referencia para el caso sin audio: se cuenta desde que arranca.
    syncStart.current = performance.now();
  }

  /** Segundos transcurridos dentro del clip, según la canción o el reloj. */
  function elapsed() {
    const a = audioRef.current;
    if (a && audioUrl) return Math.max(0, a.currentTime - start);
    return (performance.now() - syncStart.current) / 1000;
  }

  function mark() {
    syncMarks.current.push(elapsed());
    const next = syncIndex + 1;
    if (next >= textLines.length) {
      const marks = syncMarks.current;
      setLines(
        textLines.map((text, i) => ({
          text,
          start: +Math.max(0, marks[i]).toFixed(2),
          end: +(i + 1 < marks.length ? marks[i + 1] : length).toFixed(2),
        }))
      );
      setSyncing(false);
      audioRef.current?.pause();
    } else {
      setSyncIndex(next);
    }
  }

  function stopSync() {
    setSyncing(false);
    audioRef.current?.pause();
  }

  // ----------------------------------------------------------------- render
  async function render() {
    if (!support?.ok || !videoUrl) return;
    setError(null);
    setOutUrl(null);
    setOutBlob(null);
    setSaved(false);
    setRendering(true);
    setPct(0);

    const v = videoRef.current!;
    const a = audioRef.current;
    let ctxAudio: AudioContext | null = null;

    try {
      const canvas = canvasRef.current!;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // La fuente se resuelve ANTES de dibujar: si no está cargada, el canvas
      // no espera y pinta con la de reserva sin avisar de nada.
      const option = fontOptions.find((f) => f.id === fontId) ?? BUILTIN_FONTS[0];
      const fontFamily = await resolveFontFamily(option);
      await document.fonts.ready;

      const stream = canvas.captureStream(30);

      // Audio: se enruta por WebAudio para poder añadir la pista al vídeo.
      if (a && audioUrl) {
        ctxAudio = new AudioContext();
        const src = ctxAudio.createMediaElementSource(a);
        const dest = ctxAudio.createMediaStreamDestination();
        src.connect(dest);
        src.connect(ctxAudio.destination);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      }

      const { mime, ext } = support.format;
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      const done = new Promise<void>((r) => (recorder.onstop = () => r()));

      v.currentTime = start;
      v.muted = true;
      await new Promise<void>((r) => {
        const onSeek = () => {
          v.removeEventListener("seeked", onSeek);
          r();
        };
        v.addEventListener("seeked", onSeek);
      });

      if (a && audioUrl) {
        a.currentTime = start;
        await a.play().catch(() => {});
      }
      await v.play();
      recorder.start();

      await new Promise<void>((resolve) => {
        function frame() {
          const t = v.currentTime - start;
          if (t >= length || v.ended) {
            resolve();
            return;
          }
          drawCover(ctx, v);
          if (lines.length > 0) {
            drawSubtitle(ctx, W, H, lines, t, {
              style: subStyle,
              accent: songColor,
              fontFamily,
              positionPct: subtitlePosPct,
              scale: subtitleScale,
            });
          }
          setPct(Math.round((t / length) * 100));
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });

      v.pause();
      a?.pause();
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
      await ctxAudio?.close().catch(() => {});
      setRendering(false);
    }
  }

  const ext = support?.ok ? support.format.ext : "webm";
  const fileName = `${songTitle}-clip.${ext}`;

  async function save() {
    if (!outBlob) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("file", new File([outBlob], fileName, { type: outBlob.type }));
      fd.set("caption", "Clip con subtítulos");
      await addSongReference(songId, fd);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (support === null) return <p className="text-sm text-neutral-500">Comprobando…</p>;

  if (!support.ok) {
    return (
      <div className="tile p-5 flex items-start gap-3">
        <Monitor size={18} className="text-fuchsia-300 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">El montaje se hace desde el ordenador</p>
          <p className="text-sm text-neutral-400 mt-1.5 max-w-lg">
            {support.reason} Abre esta canción desde un ordenador y aquí tendrás
            el estudio completo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500">
        Monta un clip vertical con tu propio vídeo y la letra encima. Todo se
        procesa en tu ordenador.
      </p>

      {/* ------------------------------------------------------------ Vídeo */}
      <div>
        <div className="label">1 · El vídeo</div>
        <div className="flex flex-wrap gap-2">
          <label className="btn btn-secondary cursor-pointer">
            <Film size={14} /> Elegir del ordenador
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pickLocalVideo(f);
              }}
            />
          </label>
          {videos.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setVideoUrl(v.url);
                setVideoName(v.name);
                setOutUrl(null);
              }}
              className={clsx(
                "btn",
                videoUrl === v.url ? "btn-primary" : "btn-secondary"
              )}
            >
              {v.name}
            </button>
          ))}
        </div>
        {videoName && (
          <p className="text-xs text-neutral-500 mt-2">
            {videoName}
            {duration > 0 && ` · ${duration.toFixed(1)}s`}
          </p>
        )}
      </div>

      {videoUrl && (
        <>
          {/* ---------------------------------------------------- Recorte */}
          <div>
            <div className="label label-icon">
              <Scissors size={12} /> 2 · El trozo
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-xs text-neutral-400">
                Empieza en {start.toFixed(1)}s
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, duration - 1)}
                  step={0.1}
                  value={start}
                  onChange={(e) => setStart(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </label>
              <label className="text-xs text-neutral-400">
                Dura {length}s (hasta {clipEnd.toFixed(1)}s)
                <input
                  type="range"
                  min={3}
                  max={Math.min(30, Math.max(3, Math.floor(duration - start) || 30))}
                  step={1}
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </label>
            </div>
          </div>

          {/* ----------------------------------------------------- Audio */}
          {audios.length > 0 && (
            <div>
              <div className="label label-icon">
                <Music size={12} /> 3 · La canción
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAudioUrl(null)}
                  className={clsx("btn", audioUrl === null ? "btn-primary" : "btn-secondary")}
                >
                  Sin audio
                </button>
                {audios.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAudioUrl(a.url)}
                    className={clsx("btn", audioUrl === a.url ? "btn-primary" : "btn-secondary")}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
              {audioUrl && (
                <p className="text-xs text-neutral-500 mt-2">
                  El clip se exporta con esta pista de audio.
                </p>
              )}
            </div>
          )}

          {/* ------------------------------------------------ Subtítulos */}
          <div>
            <div className="label">
              {audios.length > 0 ? "4" : "3"} · La letra
            </div>
            <textarea
              value={rawLines}
              onChange={(e) => setRawLines(e.target.value)}
              rows={4}
              placeholder={"Y las noches de neón\nse apagan sin ti"}
              className="input font-mono text-sm"
              aria-label="Líneas de subtítulo"
            />

            <div className="grid sm:grid-cols-2 gap-2 mt-3">
              {SUBTITLE_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSubStyle(s.id)}
                  className={clsx(
                    "text-left rounded-lg p-2.5 border transition-colors",
                    subStyle === s.id
                      ? "border-fuchsia-500/60 bg-fuchsia-500/10"
                      : "border-white/[0.07] hover:bg-white/[0.04]"
                  )}
                >
                  <div className="text-sm">{s.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{s.description}</div>
                </button>
              ))}
            </div>

            <label className="block mt-3">
              <span className="label">Tipografía del subtítulo</span>
              <select
                value={fontId}
                onChange={(e) => setFontId(e.target.value)}
                className="input"
              >
                {fontOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                    {f.url ? " (tuya)" : ""}
                  </option>
                ))}
              </select>
            </label>

            {syncing ? (
              <div className="rounded-lg p-4 mt-3 border border-fuchsia-500/40 bg-fuchsia-500/10">
                <p className="text-xs text-neutral-400 mb-2">
                  Línea {syncIndex + 1} de {textLines.length}
                  {audioUrl ? " — pulsa cuando entre en la canción" : " — pulsa cuando deba aparecer"}
                </p>
                <p className="text-lg mb-3">{textLines[syncIndex]}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={mark} className="btn btn-primary flex-1">
                    Marcar ahora
                  </button>
                  <button type="button" onClick={stopSync} className="btn btn-secondary">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={distribute}
                  disabled={textLines.length === 0}
                  className="btn btn-secondary"
                >
                  Repartir en {length}s
                </button>
                <button
                  type="button"
                  onClick={startSync}
                  disabled={textLines.length === 0}
                  className="btn btn-secondary"
                >
                  <Timer size={14} />
                  {audioUrl ? "Sincronizar con la canción" : "Sincronizar al ritmo"}
                </button>
                {lines.length > 0 && (
                  <button type="button" onClick={() => setLines([])} className="btn btn-danger">
                    Quitar
                  </button>
                )}
              </div>
            )}

            {lines.length > 0 && !syncing && (
              <ul className="text-xs text-neutral-500 space-y-1 font-mono mt-3">
                {lines.map((l, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-neutral-600 tabular-nums w-24 shrink-0">
                      {l.start.toFixed(1)}s → {l.end.toFixed(1)}s
                    </span>
                    <span className="truncate text-neutral-400">{l.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={render}
              disabled={rendering}
              className="btn btn-primary"
            >
              {rendering ? <Loader2 size={15} className="animate-spin" /> : <Film size={15} />}
              {rendering ? `Montando… ${pct}%` : "Montar el clip"}
            </button>
            <p className="text-xs text-neutral-600 mt-2">
              El montaje va en tiempo real: {length}s de clip tardan {length}s.
            </p>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Elementos de trabajo: no se enseñan, solo alimentan al lienzo. */}
      <video
        ref={videoRef}
        src={videoUrl ?? undefined}
        onLoadedMetadata={onVideoLoaded}
        playsInline
        muted
        className="hidden"
      />
      <audio ref={audioRef} src={audioUrl ?? undefined} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {outUrl && (
        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden border border-white/[0.07] bg-black max-w-[220px]">
            <video src={outUrl} controls loop className="w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={outUrl} download={fileName} className="btn btn-secondary">
              <Download size={14} /> Descargar {ext.toUpperCase()}
            </a>
            <button
              type="button"
              onClick={save}
              disabled={saving || saved}
              className="btn btn-secondary"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saved ? "Guardado" : "Guardar en Referencias"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
