import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { formatDate, NEXT_TASK_STATUS } from "@/lib/constants";
import { TaskStatusBadge, ColorDot } from "@/components/Badges";
import { cycleDistributionStatus } from "@/lib/actions/tasks";

export default async function DistributionPage() {
  const userId = await requireUserId();
  const steps = await prisma.distributionStep.findMany({
    where: { song: { userId } },
    include: { song: true },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  const pending = steps.filter((s) => s.status !== "HECHO");
  const done = steps.filter((s) => s.status === "HECHO");

  return (
    <div className="space-y-6">
      <div>
        <div className="eyebrow mb-2">Publicación</div>
        <h1 className="display-title text-5xl sm:text-6xl">Distribución</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Todos los pasos con distribuidoras, en todas tus canciones. Pulsa el
          estado para avanzarlo sin entrar en la canción.
        </p>
      </div>

      {steps.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          Sin pasos de distribución todavía.{" "}
          <Link href="/songs" className="text-fuchsia-400 hover:underline">
            Abre una canción
          </Link>{" "}
          y añádelos desde su pestaña de Producción.
        </div>
      ) : (
        <>
          <StepList steps={pending} />
          {done.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer select-none text-sm text-neutral-500 hover:text-neutral-300 transition-colors list-none [&::-webkit-details-marker]:hidden">
                Hechos ({done.length}) — pulsar para {""}
                <span className="group-open:hidden">mostrar</span>
                <span className="hidden group-open:inline">ocultar</span>
              </summary>
              <div className="mt-3 opacity-70">
                <StepList steps={done} />
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function StepList({
  steps,
}: {
  steps: Array<{
    id: string;
    step: string;
    distributor: string;
    status: string;
    dueDate: Date | null;
    songId: string;
    song: { title: string; color: string };
  }>;
}) {
  if (steps.length === 0)
    return (
      <div className="card p-8 text-center text-sm text-neutral-500">
        Todo hecho por aquí. 🎉
      </div>
    );
  return (
    <div className="card divide-y divide-white/[0.06] overflow-hidden stagger">
      {steps.map((d) => (
        <div
          key={d.id}
          className="song-row flex items-center gap-4 px-5 py-4"
          style={{ "--song": d.song.color } as React.CSSProperties}
        >
          <ColorDot color={d.song.color} />
          <Link href={`/songs/${d.songId}?tab=distribucion`} className="flex-1 min-w-0 group/link">
            <div className="font-medium group-hover/link:underline">{d.step}</div>
            <div className="text-xs text-neutral-500 mt-0.5">
              {d.distributor} · {d.song.title}
              {d.dueDate && <span> · vence {formatDate(d.dueDate)}</span>}
            </div>
          </Link>
          <form
            action={cycleDistributionStatus.bind(
              null,
              d.songId,
              d.id,
              NEXT_TASK_STATUS[d.status as keyof typeof NEXT_TASK_STATUS]
            )}
          >
            <button type="submit" title="Cambiar estado">
              <TaskStatusBadge status={d.status} />
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
