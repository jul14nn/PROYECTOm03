import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ExternalLink, Check, AlertTriangle } from "lucide-react";
import SubmitButton from "@/components/SubmitButton";
import { setSocietyStatus } from "@/lib/actions/contracts";

export const metadata = { title: "Darse de alta en la SGAE" };

/**
 * Guía práctica del alta en SGAE.
 *
 * Los datos concretos (cuota, requisitos, reglas de reparto) están tomados de
 * la web y el reglamento de la SGAE. Cambian de vez en cuando, así que la
 * página lo dice y enlaza siempre a la fuente en vez de fingir ser la verdad
 * definitiva.
 */
export default async function GuiaSgaePage() {
  const userId = await requireUserId();

  // Si ya tiene canciones con reparto, la guía puede señalar la suya.
  const [conReparto, kit, sinRegistrar] = await Promise.all([
    prisma.song.findFirst({
      where: { userId, royalties: { some: { kind: "OBRA" } } },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.brandKit.findUnique({ where: { userId }, select: { societyStatus: true } }),
    prisma.song.count({ where: { userId, registeredAt: null, royalties: { some: {} } } }),
  ]);
  const estado = kit?.societyStatus ?? "sin_responder";

  return (
    <div className="max-w-2xl pb-16">
      <div className="eyebrow mb-2">Guía</div>
      <h1 className="display-title text-4xl sm:text-5xl">Darse de alta en la SGAE</h1>
      <p className="text-neutral-400 mt-4">
        Si tu música se escucha en algún sitio —radio, un bar, una plataforma,
        un directo— se está generando dinero a tu nombre. La SGAE es quien lo
        recauda y te lo paga. Si no estás dado de alta, ese dinero se reparte
        entre otros.
      </p>

      {/* ------------------------------------------------------- Tu situación */}
      <section className="card p-6 mt-8">
        <h2 className="font-semibold">¿En qué punto estás?</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Dilo una vez y la app deja de insistir con lo que ya tengas hecho.
        </p>
        <div className="grid sm:grid-cols-3 gap-2 mt-4">
          {[
            { id: "no", t: "No estoy dado de alta", d: "Te interesa la guía de abajo." },
            { id: "tramite", t: "Lo estoy tramitando", d: "En cuanto entres, registra tus obras." },
            { id: "alta", t: "Ya soy socio", d: "Solo te queda declarar cada canción." },
          ].map((o) => (
            <form key={o.id} action={setSocietyStatus.bind(null, o.id)}>
              <SubmitButton
                pendingLabel="…"
                className={
                  estado === o.id
                    ? "tile p-3 w-full text-left border-fuchsia-500/60 bg-fuchsia-500/10"
                    : "tile p-3 w-full text-left"
                }
              >
                <span className="block">
                  <span className="block text-sm">{o.t}</span>
                  <span className="block text-xs text-neutral-500 mt-0.5">{o.d}</span>
                </span>
              </SubmitButton>
            </form>
          ))}
        </div>

        {estado === "alta" && sinRegistrar > 0 && (
          <div className="tile p-3.5 mt-4 flex gap-2.5">
            <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-neutral-300">
              Tienes {sinRegistrar} {sinRegistrar === 1 ? "canción" : "canciones"} con
              reparto pero sin declarar.{" "}
              <Link href="/royalties" className="text-fuchsia-400 hover:underline">
                Verlas
              </Link>
              .
            </p>
          </div>
        )}
      </section>

      {/* ------------------------------------------------ Qué gestiona cada uno */}
      <section className="card p-6 mt-6">
        <h2 className="font-semibold">Antes de nada: no todo lo gestiona la SGAE</h2>
        <p className="text-sm text-neutral-400 mt-2">
          Es la confusión más común, y es la misma división que usa esta app en
          el acuerdo de reparto.
        </p>
        <div className="mt-4 space-y-3">
          {[
            {
              n: "SGAE",
              q: "Autores y editores",
              d: "Quien escribió la letra y la música. Es tu reparto de obra.",
            },
            {
              n: "AIE",
              q: "Artistas intérpretes",
              d: "Quien canta o toca en la grabación. Es parte de tu reparto de máster.",
            },
            {
              n: "AGEDI",
              q: "Productores de fonogramas",
              d: "Quien pagó y produjo la grabación: tú mismo, si te la costeas.",
            },
          ].map((e) => (
            <div key={e.n} className="tile p-3.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-medium">{e.n}</span>
                <span className="text-xs text-neutral-500">{e.q}</span>
              </div>
              <p className="text-sm text-neutral-400 mt-1">{e.d}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-neutral-400 mt-4">
          Son derechos <strong>independientes y acumulables</strong>: darte de
          alta en una no te da lo de las otras. Si escribes y además cantas tus
          canciones, te interesan las tres. AIE y AGEDI recaudan juntas bajo la
          marca <em>Somos Música</em>.
        </p>
      </section>

      {/* --------------------------------------------------------- El alta */}
      <section className="card p-6 mt-6">
        <h2 className="font-semibold">El alta, paso a paso</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Se hace entera por internet y es más corta de lo que parece.
        </p>

        <ol className="mt-5 space-y-4">
          {[
            {
              t: "Ten lista una obra ya divulgada",
              d: "Es el requisito de entrada: hace falta declarar una obra tuya que ya se haya publicado o interpretado en público. Un tema subido a una plataforma vale.",
            },
            {
              t: "Reúne tus datos",
              d: "DNI o NIE, domicilio y cuenta bancaria para los cobros. Si usas nombre artístico, tenlo claro: se declara como seudónimo y es el nombre con el que aparecerás en los repartos.",
            },
            {
              t: "Comprueba que no estás en otra sociedad",
              d: "Hay que declarar que no perteneces a ninguna otra entidad de gestión de derechos de autor. Si vienes de otra, primero hay que darse de baja.",
            },
            {
              t: "Rellena el alta online",
              d: "Se hace desde la web de la SGAE, en unos 15 minutos, desde el móvil o el ordenador. Eliges el grupo profesional al que perteneces (música, letra, audiovisual…).",
            },
            {
              t: "Paga la cuota de entrada",
              d: "Un único pago de 15 € por el alta. No hay cuota anual por ser socio, y el registro de obras es gratuito una vez dentro.",
            },
          ].map((p, i) => (
            <li key={i} className="flex gap-3.5">
              <span className="numeral text-lg text-fuchsia-300 shrink-0 w-6">{i + 1}</span>
              <div>
                <div className="font-medium text-sm">{p.t}</div>
                <p className="text-sm text-neutral-400 mt-0.5">{p.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="tile p-3.5 mt-5 flex gap-2.5">
          <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-neutral-400">
            <strong className="text-neutral-200">Si eres menor de edad</strong>,
            la solicitud tiene que ir firmada por tu madre, padre o tutor legal.
          </p>
        </div>

        <a
          href="https://www.sgae.es/autores-editores/alta-online/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary mt-5"
        >
          Ir al alta online <ExternalLink size={14} />
        </a>
      </section>

      {/* ----------------------------------------------- Registrar las obras */}
      <section className="card p-6 mt-6">
        <h2 className="font-semibold">Después: registrar cada canción</h2>
        <p className="text-sm text-neutral-400 mt-2">
          Ser socio no registra tus canciones solo. Cada obra hay que
          declararla, desde la Sede Electrónica. Es gratis para socios, y es
          justo aquí donde tu acuerdo de reparto se convierte en dinero: los
          porcentajes que declares son los que la SGAE usará para pagar.
        </p>

        <div className="tile p-4 mt-4">
          <div className="label">Dos reglas que conviene saber antes</div>
          <ul className="text-sm text-neutral-400 space-y-2 mt-1">
            <li>
              · <strong className="text-neutral-200">50% música y 50% letra.</strong>{" "}
              Es el reparto por defecto si no pactáis otra cosa. Dentro de cada
              mitad, los coautores van a partes iguales salvo acuerdo distinto.
            </li>
            <li>
              · <strong className="text-neutral-200">Mínimo un 10%.</strong> No se
              puede asignar al conjunto de la parte musical, ni al texto, una
              participación menor del 10%.
            </li>
          </ul>
        </div>

        <p className="text-sm text-neutral-400 mt-4">
          Si la canción parte de un texto que no es tuyo, necesitas autorización
          escrita de quien lo escribió, con los porcentajes reflejados.
        </p>

        {conReparto && (
          <div className="tile p-4 mt-4">
            <div className="flex gap-2.5">
              <Check size={15} className="text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-neutral-300">
                  Tú ya tienes el reparto de «{conReparto.title}» hecho. Cuando
                  la declares, usa esos mismos porcentajes.
                </p>
                <Link
                  href={`/songs/${conReparto.id}/contrato`}
                  className="text-sm text-fuchsia-400 hover:underline mt-1 inline-block"
                >
                  Ver su acuerdo de reparto
                </Link>
              </div>
            </div>
          </div>
        )}

        <a
          href="https://sede.sgae.es/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary mt-5"
        >
          Sede Electrónica (registrar obras) <ExternalLink size={14} />
        </a>
      </section>

      {/* -------------------------------------------------- ¿Me compensa? */}
      <section className="card p-6 mt-6">
        <h2 className="font-semibold">¿Me compensa ahora mismo?</h2>
        <div className="mt-3 space-y-3 text-sm text-neutral-400">
          <p>
            <strong className="text-neutral-200">Sí, si</strong> tocas en directo
            con temas propios, suenas en radio o televisión, tu música se
            programa en locales, o publicas con cierta constancia. Ahí hay
            recaudación que solo cobras estando dado de alta.
          </p>
          <p>
            <strong className="text-neutral-200">Puede esperar si</strong> aún no
            has publicado nada — de hecho no podrías, porque hace falta una obra
            ya divulgada para entrar.
          </p>
          <p>
            Ojo con una idea muy extendida: <strong className="text-neutral-200">tu
            distribuidora no hace esto</strong>. Ella te paga las reproducciones del
            máster en plataformas; los derechos de autor de la composición van
            por otro camino, y ese camino es la SGAE.
          </p>
        </div>
      </section>

      <p className="text-xs text-neutral-600 leading-relaxed mt-6">
        Datos tomados de la web y el reglamento de la SGAE. Las cuotas y los
        requisitos cambian de vez en cuando: confirma siempre en{" "}
        <a
          href="https://www.sgae.es/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-500 hover:text-neutral-300 underline"
        >
          sgae.es
        </a>{" "}
        antes de dar un paso. Esta guía te orienta; no es asesoramiento legal.
      </p>
    </div>
  );
}
