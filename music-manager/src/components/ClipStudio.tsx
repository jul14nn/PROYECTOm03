"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Film,
  Download,
  Save,
  Loader2,
  Monitor,
  Timer,
  Play,
  Pause,
  Upload,
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
import { drawCover, seek, extractThumbnails } from "@/lib/videoFrames";
import Timeline, { tiempo } from "@/components/clip/Timeline";

const W = 720;
const H = 1280;

export type StudioAsset = { id: string; name: string; url: string };

/**
 * Estudio de clips.
 *
 * Maquetado como un editor de vídeo y no como un formulario: previsualización
 * a la izquierda, ajustes a la derecha y línea de tiempo abajo. Lo que se ve
 * en la previsualización es exactamente lo que se va a grabar, porque ambos
 * dibujan en el mismo lienzo con el mismo código.
 */
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
  initialLyrics,
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
  initialLyrics?: string | null;
}) {
  const [support, setSupport] = useState<VideoSupport | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [length, setLength] = useState(10);

  const [thumbs, setThumbs] = useState<string[]>([]);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);

  const [rawLines, setRawLines] = useState(initialLyrics ?? "");
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const [subStyle, setSubStyle] = useState<SubtitleStyleId>(defaultSubtitleStyle);
  const [fontId, setFontId] = useState<string>(BUILTIN_FONTS[0].id);
  const [previewFont, setPreviewFont] = useState<string>(BUILTIN_FONTS[0].family);

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
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupport(checkVideoSupport());
  }, []);

  useEffect(() => {
    const urls = localUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const fontOptions: FontOption[] = useMemo(
    () => [
      ...BUILTIN_FONTS,
      ...fonts.map((f) => ({ id: f.id, name: f.name, family: "", url: f.url })),
    ],
    [fonts]
  );

  // La tipografía se resuelve aparte y antes de dibujar: el lienzo no espera
  // a que cargue y pintaría con la de reserva sin avisar.
  useEffect(() => {
    let vigente = true;
    const opcion = fontOptions.find((f) => f.id === fontId) ?? BUILTIN_FONTS[0];
    resolveFontFamily(opcion)
      .then((f) => {
        if (vigente) setPreviewFont(f);
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [fontId, fontOptions]);

  const textLines = rawLines.split("\n").map((l) => l.trim()).filter(Boolean);
  const clipEnd = Math.min(duration || length, start + length);

  /** Pinta el fotograma actual con sus subtítulos. Lo mismo que graba. */
  const dibujar = useCallback(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || !v.videoWidth) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    drawCover(ctx, v, W, H);
    if (lines.length > 0) {
      drawSubtitle(ctx, W, H, lines, v.currentTime - start, {
        style: subStyle,
        accent: songColor,
        fontFamily: previewFont,
        positionPct: subtitlePosPct,
        scale: subtitleScale,
      });
    }
  }, [lines, start, subStyle, songColor, previewFont, subtitlePosPct, subtitleScale]);

  // Repintar cuando cambia algo visible y no se está reproduciendo ni grabando.
  useEffect(() => {
    if (playing || rendering) return;
    dibujar();
  }, [dibujar, playing, rendering, playhead]);

  function pickLocalVideo(file: File) {
    const url = URL.createObjectURL(file);
    localUrls.current.push(url);
    elegirVideo(url, file.name);
  }

  function elegirVideo(url: string, name: string) {
    setVideoUrl(url);
    setVideoName(name);
    setOutUrl(null);
    setLines([]);
    setThumbs([]);
    setPlayhead(0);
  }

  async function onVideoLoaded() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v) return;
    if (c) {
      c.width = W;
      c.height = H;
    }
    setDuration(v.duration);
    setStart(0);
    setLength(Math.min(10, Math.floor(v.duration) || 10));
    setPlayhead(0);
    await seek(v, 0);
    dibujar();
    // Las miniaturas van después: mueven el cursor del vídeo y tardan.
    setThumbs(await extractThumbnails(v, 12));
    await seek(v, 0);
    dibujar();
  }

  // -------------------------------------------------------------- transporte
  const irA = useCallback(
    async (t: number) => {
      const v = videoRef.current;
      if (!v) return;
      const destino = Math.max(0, Math.min(duration, t));
      setPlayhead(destino);
      await seek(v, destino);
      dibujar();
    },
    [duration, dibujar]
  );

  function pausar() {
    cancelAnimationFrame(rafRef.current);
    videoRef.current?.pause();
    audioRef.current?.pause();
    setPlaying(false);
  }

  async function reproducir() {
    const v = videoRef.current;
    if (!v) return;
    // Reproducir siempre recorre el trozo elegido, no el vídeo entero.
    const desde = playhead < start || playhead >= clipEnd ? start : playhead;
    await seek(v, desde);
    const a = audioRef.current;
    if (a && audioUrl) {
      a.currentTime = desde;
      await a.play().catch(() => {});
    }
    v.muted = true;
    await v.play().catch(() => {});
    setPlaying(true);

    const paso = () => {
      const actual = videoRef.current;
      if (!actual) return;
      if (actual.currentTime >= clipEnd || actual.ended) {
        pausar();
        void irA(start);
        return;
      }
      setPlayhead(actual.currentTime);
      dibujar();
      rafRef.current = requestAnimationFrame(paso);
    };
    rafRef.current = requestAnimationFrame(paso);
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

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

  // ----------------------------------------------------------------- montaje
  async function render() {
    if (!support?.ok || !videoUrl) return;
    pausar();
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

      const option = fontOptions.find((f) => f.id === fontId) ?? BUILTIN_FONTS[0];
      const fontFamily = await resolveFontFamily(option);
      await document.fonts.ready;

      const stream = canvas.captureStream(30);

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

      await seek(v, start);
      v.muted = true;

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
          drawCover(ctx, v, W, H);
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
        err instanceof Error
          ? `No se pudo montar el clip: ${err.message}`
          : "No se pudo montar el clip."
      );
    } finally {
      await ctxAudio?.close().catch(() => {});
      setRendering(false);
      void irA(start);
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

  const audioName = audios.find((a) => a.url === audioUrl)?.name ?? null;

  return (
    <div className="space-y-4" style={{ ["--song" as string]: songColor }}>
      {/* --------------------------------------------------- Barra de origen */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="btn btn-secondary cursor-pointer">
          <Upload size={14} /> Abrir vídeo
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
            onClick={() => elegirVideo(v.url, v.name)}
            className={clsx("btn", videoUrl === v.url ? "btn-primary" : "btn-secondary")}
          >
            {v.name}
          </button>
        ))}
        {videoName && (
          <span className="text-xs text-neutral-500 ml-auto">
            {videoName}
            {duration > 0 && ` · ${tiempo(duration)}`}
          </span>
        )}
      </div>

      {!videoUrl && (
        <div className="tile p-8 text-center">
          <Film size={22} className="mx-auto text-neutral-600 mb-3" />
          <p className="text-sm text-neutral-400">
            Abre un vídeo para empezar a montar.
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            Todo se procesa en tu ordenador: el vídeo no sale de aquí hasta que
            tú lo guardes.
          </p>
        </div>
      )}

      {videoUrl && (
        <>
          <div className="grid lg:grid-cols-[minmax(0,17rem)_1fr] gap-5">
            {/* ------------------------------------------ Previsualización */}
            <div>
              <div
                className="rounded-xl overflow-hidden bg-black relative"
                style={{ border: "1px solid var(--edge)" }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full block"
                  style={{ aspectRatio: "9 / 16" }}
                />
                {rendering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm">
                    Montando… {pct}%
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-2.5">
                <button
                  type="button"
                  onClick={() => (playing ? pausar() : void reproducir())}
                  className="btn btn-secondary"
                  aria-label={playing ? "Pausar" : "Reproducir"}
                  disabled={rendering}
                >
                  {playing ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <span className="text-xs text-neutral-500 numeral">
                  {tiempo(Math.max(0, playhead - start))} / {tiempo(length)}
                </span>
              </div>
            </div>

            {/* --------------------------------------------------- Ajustes */}
            <div className="space-y-4 min-w-0">
              <div>
                <span className="label">Letra</span>
                <textarea
                  value={rawLines}
                  onChange={(e) => setRawLines(e.target.value)}
                  rows={4}
                  placeholder={"Y las noches de neón\nse apagan sin ti"}
                  className="input font-mono text-sm"
                  aria-label="Líneas de subtítulo"
                />
              </div>

              <div>
                <span className="label">Estilo</span>
                <div className="grid sm:grid-cols-2 gap-2">
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
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <label>
                  <span className="label">Tipografía</span>
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

                {audios.length > 0 && (
                  <label>
                    <span className="label">Audio</span>
                    <select
                      value={audioUrl ?? ""}
                      onChange={(e) => setAudioUrl(e.target.value || null)}
                      className="input"
                    >
                      <option value="">Sin audio</option>
                      {audios.map((a) => (
                        <option key={a.id} value={a.url}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {syncing ? (
                <div className="rounded-lg p-4 border border-fuchsia-500/40 bg-fuchsia-500/10">
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
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={distribute}
                    disabled={textLines.length === 0}
                    className="btn btn-secondary"
                  >
                    Repartir en {length.toFixed(0)}s
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
            </div>
          </div>

          {/* ------------------------------------------------ Línea de tiempo */}
          <Timeline
            duration={duration}
            start={start}
            length={length}
            playhead={playhead}
            thumbs={thumbs}
            lines={lines}
            audioName={audioName}
            color={songColor}
            onTrim={(s, l) => {
              setStart(s);
              setLength(l);
            }}
            onSeek={(t) => {
              if (playing) pausar();
              void irA(t);
            }}
          />

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={render}
              disabled={rendering}
              className="btn btn-primary"
            >
              {rendering ? <Loader2 size={15} className="animate-spin" /> : <Film size={15} />}
              {rendering ? `Montando… ${pct}%` : "Montar el clip"}
            </button>
            <span className="text-xs text-neutral-600">
              El montaje va en tiempo real: {length.toFixed(0)}s de clip tardan{" "}
              {length.toFixed(0)}s.
            </span>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Fuentes de imagen y sonido. `crossOrigin` es imprescindible: sin él,
          un vídeo servido desde el almacenamiento contamina el lienzo y
          `captureStream()` falla con un error de seguridad al grabar. */}
      <video
        ref={videoRef}
        src={videoUrl ?? undefined}
        crossOrigin="anonymous"
        onLoadedMetadata={onVideoLoaded}
        playsInline
        muted
        className="hidden"
      />
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        crossOrigin="anonymous"
        className="hidden"
      />

      {outUrl && (
        <div className="space-y-3 pt-1">
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
