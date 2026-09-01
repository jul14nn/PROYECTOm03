"use client";

import { useState } from "react";
import { SUGGESTED_COLORS } from "@/lib/constants";
import SubmitButton from "@/components/SubmitButton";
import SongDetailFields from "@/components/SongDetailFields";
import { ChevronRight } from "lucide-react";

/**
 * Dar de alta una canción.
 *
 * Se presentaba como el mismo formulario que la edición: nueve campos con el
 * mismo peso, pidiendo BPM y tonalidad en el momento en que solo tienes un
 * nombre y una idea. Aquí solo importa una cosa —cómo se llama— y todo lo
 * demás se rellena después desde la ficha, que ya tiene su pestaña de Info.
 *
 * Así que el título es la página, el color se elige viéndolo, y el resto va
 * plegado. Los campos plegados siguen montados y se envían con sus valores
 * por defecto: ver la nota en SongDetailFields.
 */
export default function NewSongForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [color, setColor] = useState(SUGGESTED_COLORS[0]);
  const [titulo, setTitulo] = useState("");

  return (
    <form
      action={action}
      className="relative"
      style={{ "--song": color } as React.CSSProperties}
    >
      {/* El color elegido tiñe la pantalla en vivo. Es lo único con gracia de
          este formulario y estaba reducido a ocho puntitos entre dos campos. */}
      <div
        aria-hidden
        className="absolute -inset-x-10 -top-16 h-72 pointer-events-none -z-10 transition-[background] duration-500"
        style={{
          background: `radial-gradient(55% 100% at 20% 0%, color-mix(in srgb, ${color} 26%, transparent), transparent 72%)`,
          filter: "blur(28px)",
        }}
      />

      <div className="eyebrow mb-4">Nueva canción</div>

      {/* El título, a tamaño de titular y sin caja: se escribe el nombre como
          se escribe en la funda de un disco, no como se rellena una ficha. */}
      <input
        id="title"
        name="title"
        required
        autoFocus
        autoComplete="off"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="¿Cómo se llama?"
        aria-label="Título de la canción"
        className="display-title w-full bg-transparent border-0 outline-none
                   text-4xl sm:text-6xl leading-[1.05] text-white
                   placeholder:text-neutral-700 focus:placeholder:text-neutral-600
                   p-0 pb-4 border-b transition-colors"
        style={{
          borderColor: titulo
            ? `color-mix(in srgb, ${color} 70%, transparent)`
            : "rgba(255,255,255,0.12)",
        }}
      />

      <div className="mt-7 flex flex-wrap items-center gap-2">
        <span className="label mr-1">Color</span>
        {SUGGESTED_COLORS.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setColor(c)}
            className="h-7 w-7 rounded-full transition-transform hover:scale-110"
            style={{
              backgroundColor: c,
              boxShadow: c === color ? "0 0 0 2px var(--background), 0 0 0 4px white" : "none",
            }}
            aria-label={`Color ${c}`}
            aria-pressed={c === color}
          />
        ))}
        {/* El nativo se pinta como un cuadrado y rompía la fila de círculos.
            Se recorta redondo y se le quita el marco propio del control. */}
        <span
          className="relative h-7 w-7 rounded-full overflow-hidden shrink-0"
          style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)" }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute -inset-2 h-11 w-11 cursor-pointer bg-transparent border-0 p-0"
            aria-label="Color personalizado"
          />
        </span>
        <input type="hidden" name="color" value={color} />
      </div>

      <div className="mt-9 flex flex-wrap items-center gap-4">
        <SubmitButton className="btn btn-primary text-base px-6 py-3" pendingLabel="Creando…">
          Crear canción
        </SubmitButton>
        <p className="text-sm text-neutral-500">
          Con el nombre basta. El resto se rellena luego, sin prisa.
        </p>
      </div>

      {/* Plegado, no eliminado: quien ya sabe el BPM puede dejarlo escrito de
          una vez sin tener que entrar después en la ficha. */}
      <details className="group mt-10 border-t border-white/[0.08] pt-6">
        <summary
          className="cursor-pointer select-none text-sm text-neutral-500 hover:text-neutral-200
                     transition-colors list-none [&::-webkit-details-marker]:hidden
                     flex items-center gap-1.5"
        >
          <ChevronRight size={14} className="transition-transform group-open:rotate-90" />
          Añadir detalles ahora
        </summary>
        <div className="mt-6">
          <SongDetailFields />
        </div>
      </details>
    </form>
  );
}
