"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Upload, Loader2 } from "lucide-react";
import { ASSET_RULES, type AssetKind } from "@/lib/assets";
import { registerAsset } from "@/lib/actions/assets";

/**
 * Sube un fichero directamente del navegador al almacenamiento.
 *
 * El fichero no pasa por ninguna función de servidor, que es lo que permite
 * subir clips de decenas de megas: la ruta solo firma el permiso.
 */
export default function AssetUploader({
  kind,
  songId = null,
  label,
  enabled,
}: {
  kind: AssetKind;
  songId?: string | null;
  label: string;
  /** false cuando el almacenamiento no está configurado. */
  enabled: boolean;
}) {
  const rule = ASSET_RULES[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (file.size > rule.maxBytes) {
      setError(
        `«${file.name}» pesa demasiado. El límite para ${rule.label.toLowerCase()} es ${Math.round(rule.maxBytes / 1024 / 1024)} MB.`
      );
      return;
    }

    setBusy(true);
    setPct(0);
    try {
      const blob = await upload(`${kind.toLowerCase()}/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        clientPayload: JSON.stringify({ kind, songId }),
        onUploadProgress: ({ percentage }) => setPct(Math.round(percentage)),
      });

      // El aviso del almacenamiento no llega en desarrollo local, así que el
      // registro se confirma también desde aquí. En producción es idempotente.
      await registerAsset({
        url: blob.url,
        pathname: blob.pathname,
        kind,
        songId,
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
      });
    } catch (err) {
      setError(
        err instanceof Error ? `No se pudo subir: ${err.message}` : "No se pudo subir el archivo."
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (!enabled) {
    return (
      <p className="text-xs text-amber-300/80">
        Para subir archivos hace falta configurar el almacenamiento
        (BLOB_READ_WRITE_TOKEN) en el despliegue.
      </p>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={rule.extensions}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn btn-secondary"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {busy ? `Subiendo… ${pct}%` : label}
        </button>
        <span className="text-xs text-neutral-600">{rule.hint}</span>
      </div>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
