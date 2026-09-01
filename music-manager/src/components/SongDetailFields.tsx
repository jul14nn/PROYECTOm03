import { STAGES, STAGE_LABELS, formatDateInput } from "@/lib/constants";
import DatePicker from "@/components/DatePicker";

export type SongLike = {
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

/**
 * Todo lo que no es el título ni el color.
 *
 * Vive aparte porque las dos pantallas lo presentan distinto: al editar está
 * a la vista, y al crear va plegado. Comparten los campos para que añadir uno
 * no obligue a acordarse de tocar dos sitios.
 *
 * Importante para el plegado: estos campos siguen montados aunque no se vean,
 * así que se envían con sus valores por defecto. Si se desmontaran, una
 * canción nueva nacería con `needsCover` en falso —la acción lo lee como
 * `=== "on"`— y se perdería el aviso de que falta la portada.
 */
export default function SongDetailFields({ song }: { song?: SongLike }) {
  return (
    <div className="space-y-5">
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
    </div>
  );
}
