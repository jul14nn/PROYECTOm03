"use client";

import { useState } from "react";
import { STAGES, STAGE_LABELS, SUGGESTED_COLORS, formatDateInput } from "@/lib/constants";
import DatePicker from "@/components/DatePicker";

type SongLike = {
  id?: string;
  title: string;
  genre: string | null;
  color: string;
  stage: string;
  needsCover: boolean;
  coverUrl?: string | null;
  bpm: number | null;
  key: string | null;
  notes: string | null;
  releaseDate: Date | string | null;
};

export default function SongForm({
  action,
  song,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  song?: SongLike;
  submitLabel: string;
}) {
  const [color, setColor] = useState(song?.color ?? SUGGESTED_COLORS[0]);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="label" htmlFor="title">
          Título *
        </label>
        <input
          id="title"
          name="title"
          className="input"
          defaultValue={song?.title}
          placeholder="Nombre de la canción"
          required
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="genre">
            Tipo / género
          </label>
          <input
            id="genre"
            name="genre"
            className="input"
            defaultValue={song?.genre ?? ""}
            placeholder="Trap, Pop, Reggaetón..."
          />
        </div>
        <div>
          <label className="label" htmlFor="stage">
            Etapa
          </label>
          <select id="stage" name="stage" className="input" defaultValue={song?.stage ?? "IDEA"}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Color identificativo</label>
        <div className="flex items-center gap-2 flex-wrap">
          {SUGGESTED_COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full ring-2 transition-all"
              style={{
                backgroundColor: c,
                borderColor: c === color ? "white" : "transparent",
                boxShadow: c === color ? "0 0 0 2px white" : "none",
              }}
              aria-label={c}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-7 w-9 rounded cursor-pointer bg-transparent"
          />
        </div>
        <input type="hidden" name="color" value={color} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="label" htmlFor="bpm">
            BPM
          </label>
          <input id="bpm" name="bpm" type="number" className="input" defaultValue={song?.bpm ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="key">
            Tonalidad
          </label>
          <input id="key" name="key" className="input" defaultValue={song?.key ?? ""} placeholder="Am, C#m..." />
        </div>
        <div>
          <label className="label" htmlFor="releaseDate">
            Fecha aproximada de lanzamiento
          </label>
          <DatePicker name="releaseDate" defaultValue={formatDateInput(song?.releaseDate) || null} />
          <p className="text-xs text-neutral-600 mt-1">
            Es una fecha orientativa (~), no un compromiso cerrado.
          </p>
        </div>
      </div>

      {song?.id && (
        <div>
          <label className="label" htmlFor="coverUrl">
            URL de la portada
          </label>
          <input
            id="coverUrl"
            name="coverUrl"
            className="input"
            defaultValue={song?.coverUrl ?? ""}
            placeholder="https://..."
          />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          name="needsCover"
          defaultChecked={song?.needsCover ?? true}
          className="rounded"
        />
        Falta sacar portada
      </label>

      <div>
        <label className="label" htmlFor="notes">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          className="input"
          rows={4}
          defaultValue={song?.notes ?? ""}
          placeholder="Ideas, referencias, letra pendiente..."
        />
      </div>

      <button type="submit" className="btn btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
