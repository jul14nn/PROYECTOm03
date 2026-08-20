import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { buildCampaigns } from "@/lib/campaignSpan";
import Arreglo from "@/components/lab/Arreglo";
import Consola from "@/components/lab/Consola";
import Archivo from "@/components/lab/Archivo";

const VIEWS = [
  {
    id: "arreglo",
    name: "Arreglo",
    idea: "El tiempo en horizontal, una pista por canción y las fases como clips. Como la ventana de arreglo de un DAW.",
  },
  {
    id: "consola",
    name: "Consola",
    idea: "Un canal por canción: el fader marca la etapa de producción y el vúmetro, el avance del plan.",
  },
  {
    id: "archivo",
    name: "Archivo",
    idea: "El catálogo como estantería de fundas. La portada que falta es una funda en blanco.",
  },
] as const;

export default async function LaboratorioPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const active = VIEWS.find((x) => x.id === v) ?? VIEWS[0];

  const userId = await requireUserId();
  const songs = await prisma.song.findMany({
    where: { userId },
    include: { launchTasks: { select: { status: true, phase: true } } },
    orderBy: { releaseDate: "asc" },
  });

  const campaigns = buildCampaigns(songs);

  return (
    <div className="max-w-5xl">
      <header className="pb-8">
        <div className="eyebrow mb-3">Propuestas de diseño</div>
        <h1 className="display-title text-5xl sm:text-6xl">Laboratorio</h1>
        <p className="text-neutral-400 text-sm mt-4 max-w-xl">
          Tres formas de mirar el mismo catálogo, sacadas del mundo del estudio
          y no del catálogo de interfaces. Todas funcionan con tus canciones de
          verdad.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-8">
        {VIEWS.map((x) => (
          <Link
            key={x.id}
            href={`/laboratorio?v=${x.id}`}
            className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={
              x.id === active.id
                ? {
                    background: "linear-gradient(135deg, var(--accent-violet), var(--accent-magenta))",
                    color: "white",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)",
                  }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid var(--edge)" }
            }
          >
            {x.name}
          </Link>
        ))}
      </div>

      <p className="text-sm text-neutral-500 mb-6 max-w-2xl">{active.idea}</p>

      {active.id === "arreglo" && <Arreglo campaigns={campaigns} />}
      {active.id === "consola" && <Consola campaigns={campaigns} />}
      {active.id === "archivo" && <Archivo campaigns={campaigns} />}
    </div>
  );
}
