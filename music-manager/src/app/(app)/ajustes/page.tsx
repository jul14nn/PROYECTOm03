import { BUILTIN_FONTS, DEFAULT_FONT_ID } from "@/lib/loadFont";
import { prisma } from "@/lib/prisma";
import SubmitButton from "@/components/SubmitButton";
import { requireUserId } from "@/lib/auth";
import { saveBrandKit } from "@/lib/actions/brandKit";
import { SUBTITLE_STYLES } from "@/lib/subtitleStyles";
import { VIDEO_STYLES } from "@/lib/videoStyles";
import { SUGGESTED_COLORS } from "@/lib/constants";
import { THEMES } from "@/lib/themes";
import AssetUploader from "@/components/AssetUploader";
import AssetList from "@/components/AssetList";
import { isBlobConfigured } from "@/lib/blob";

/* La lista sale de un único sitio: mantener una copia a mano aquí ya provocó
   que se ofrecieran fuentes que el lienzo no sabía dibujar. */
const FONTS = BUILTIN_FONTS.map((f) => ({ value: f.id, label: f.name }));

export default async function AjustesPage() {
  const userId = await requireUserId();
  const [kit, fonts] = await Promise.all([
    prisma.brandKit.findUnique({ where: { userId } }),
    prisma.asset.findMany({
      where: { userId, kind: "FONT" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
          <h2 className="eyebrow pb-3 border-b border-white/20 mb-5">Apariencia</h2>
          <div className="space-y-5">
            <div>
              <span className="label">Tema</span>
              <div className="grid sm:grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <label key={t.id} className="tile p-3 flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value={t.id}
                      defaultChecked={(kit?.theme ?? "neon") === t.id}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm">{t.name}</span>
                      <span className="block text-xs text-neutral-500 mt-0.5">
                        {t.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </section>

        <section>
          <h2 className="eyebrow pb-3 border-b border-white/20 mb-5">Colores de marca</h2>
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
                defaultValue={kit?.fontFamily ?? DEFAULT_FONT_ID}
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

      <section className="mt-12">
        <h2 className="eyebrow pb-3 border-b border-white/20 mb-5">Tus tipografías</h2>
        <p className="text-sm text-neutral-400 mb-4 max-w-lg">
          Sube las fuentes de tu identidad y podrás elegirlas para los
          subtítulos de los clips. Se cargan solo en tu navegador cuando montas
          un vídeo.
        </p>
        <AssetUploader kind="FONT" label="Subir una tipografía" enabled={isBlobConfigured()} />
        <AssetList assets={fonts} />
      </section>
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
