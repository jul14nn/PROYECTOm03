"use client";

import { useState } from "react";
import { SUGGESTED_COLORS } from "@/lib/constants";
import SubmitButton from "@/components/SubmitButton";
import SongDetailFields, { type SongLike } from "@/components/SongDetailFields";

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

      <SongDetailFields song={song} />

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
