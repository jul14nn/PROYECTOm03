import { prisma } from "@/lib/prisma";
import SubmitButton from "@/components/SubmitButton";
import { requireUserId } from "@/lib/auth";
import { saveBrandKit } from "@/lib/actions/brandKit";
import { SUBTITLE_STYLES } from "@/lib/subtitleStyles";
import { VIDEO_STYLES } from "@/lib/videoStyles";
import { SUGGESTED_COLORS } from "@/lib/constants";

const FONTS = [
  { value: "Anton", label: "Anton — cartel condensada" },
  { value: "Geist", label: "Geist — limpia y neutra" },
  { value: "Georgia", label: "Georgia — serif clásica" },
  { value: "Impact", label: "Impact — muy contundente" },
];

export default async function AjustesPage() {
  const userId = await requireUserId();
  const kit = await prisma.brandKit.findUnique({ where: { userId } });

  return (
    <div className="max-w-2xl">
      <header className="pb-10">
        <div className="eyebrow mb-3">Tu identidad</div>
        <h1 className="display-title text-5xl sm:text-6xl">Ajustes</h1>
        <p className="text-neutral-400 text-sm mt-4 max-w-lg">
          Preferencias visuales que se aplican a todo lo que generes, para que no
          tengas que reconfigurarlas en cada canción.
        </p>
      </header>

      <form action={saveBrandKit} className="space-y-10">
        <section>
          <h2 className="eyebrow pb-3 border-b border-white/20 mb-5">Colores</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <ColorField
              name="primaryColor"
              label="Color principal"
              defaultValue={kit?.primaryColor ?? "#9333ea"}
            />
            <ColorField
              name="secondaryColor"
              label="Color secundario"
              defaultValue={kit?.secondaryColor ?? "#e0299e"}
            />
          </div>
        </section>

        <section>
          <h2 className="eyebrow pb-3 border-b border-white/20 mb-5">Vídeo</h2>
          <div className="space-y-5">
            <div>
              <label className="label" htmlFor="defaultVideoStyle">
                Estilo por defecto
              </label>
              <select
                id="defaultVideoStyle"
                name="defaultVideoStyle"
                defaultValue={kit?.defaultVideoStyle ?? "neon"}
                className="input"
              >
                {VIDEO_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="fontFamily">
                Tipografía de los títulos
              </label>
              <select
                id="fontFamily"
                name="fontFamily"
                defaultValue={kit?.fontFamily ?? "Anton"}
                className="input"
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="eyebrow pb-3 border-b border-white/20 mb-5">Subtítulos</h2>
          <div className="space-y-5">
            <div>
              <span className="label">Plantilla por defecto</span>
              <div className="grid sm:grid-cols-2 gap-2">
                {SUBTITLE_STYLES.map((s, i) => (
                  <label
                    key={s.id}
                    className="tile p-3 flex items-start gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="subtitleStyle"
                      value={s.id}
                      defaultChecked={
                        kit ? kit.subtitleStyle === s.id : i === 1 /* barra */
                      }
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm">{s.name}</span>
                      <span className="block text-xs text-neutral-500 mt-0.5">
                        {s.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label" htmlFor="subtitlePosPct">
                  Altura en pantalla
                </label>
                <input
                  id="subtitlePosPct"
                  name="subtitlePosPct"
                  type="number"
                  min={40}
                  max={92}
                  step={1}
                  defaultValue={kit?.subtitlePosPct ?? 78}
                  className="input"
                />
                <p className="text-xs text-neutral-600 mt-1.5">
                  Porcentaje desde arriba. 78% deja libre la zona donde TikTok pone
                  sus botones.
                </p>
              </div>
              <div>
                <label className="label" htmlFor="subtitleScale">
                  Tamaño
                </label>
                <input
                  id="subtitleScale"
                  name="subtitleScale"
                  type="number"
                  min={0.7}
                  max={1.5}
                  step={0.05}
                  defaultValue={kit?.subtitleScale ?? 1}
                  className="input"
                />
                <p className="text-xs text-neutral-600 mt-1.5">
                  1 es el tamaño normal.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-white/20 pt-6">
          <SubmitButton pendingLabel="Guardando…">Guardar preferencias</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function ColorField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={name}
          name={name}
          type="color"
          defaultValue={defaultValue}
          className="h-10 w-14 rounded-lg bg-transparent border border-white/[0.09] cursor-pointer"
        />
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_COLORS.slice(0, 6).map((c) => (
            <span
              key={c}
              className="h-5 w-5 rounded-full ring-1 ring-white/20"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
