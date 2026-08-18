import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/constants";
import { TaskStatusBadge, ColorDot } from "@/components/Badges";

export default async function DistributionPage() {
  const steps = await prisma.distributionStep.findMany({
    include: { song: true },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Distribución</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Todos los pasos con distribuidoras, en todas tus canciones.
        </p>
      </div>

      {steps.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          Sin pasos de distribución todavía. Añádelos desde la ficha de cada canción.
        </div>
      ) : (
        <div className="card divide-y divide-neutral-800 overflow-hidden">
          {steps.map((d) => (
            <Link
              key={d.id}
              href={`/songs/${d.songId}#distribucion`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-900/60"
            >
              <ColorDot color={d.song.color} />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{d.step}</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {d.distributor} · {d.song.title}
                  {d.dueDate && <span> · vence {formatDate(d.dueDate)}</span>}
                </div>
              </div>
              <TaskStatusBadge status={d.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
