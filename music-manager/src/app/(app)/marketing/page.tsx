import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { formatMoney } from "@/lib/constants";
import { TaskStatusBadge, ColorDot } from "@/components/Badges";

export default async function MarketingPage() {
  const userId = await requireUserId();
  const [songs, ideas] = await Promise.all([
    prisma.song.findMany({
      where: { userId, marketingBudgets: { some: {} } },
      include: { marketingBudgets: true },
      orderBy: { title: "asc" },
    }),
    prisma.marketingIdea.findMany({
      where: { song: { userId } },
      include: { song: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalPlanned = songs.flatMap((s) => s.marketingBudgets).reduce((a, b) => a + b.plannedAmount, 0);
  const totalActual = songs.flatMap((s) => s.marketingBudgets).reduce((a, b) => a + b.actualAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Marketing</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Presupuesto e ideas de marketing por canción. Gastado {formatMoney(totalActual)} de{" "}
          {formatMoney(totalPlanned)} planificado.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="font-semibold mb-3">Presupuesto por canción</h2>
          <div className="space-y-3">
            {songs.map((song) => {
              const planned = song.marketingBudgets.reduce((a, b) => a + b.plannedAmount, 0);
              const actual = song.marketingBudgets.reduce((a, b) => a + b.actualAmount, 0);
              return (
                <Link
                  key={song.id}
                  href={`/songs/${song.id}#marketing`}
                  className="flex items-center justify-between text-sm hover:bg-neutral-900 rounded-lg px-2 py-2 -mx-2"
                >
                  <span className="flex items-center gap-2">
                    <ColorDot color={song.color} /> {song.title}
                  </span>
                  <span className="text-neutral-400">
                    {formatMoney(actual)} / {formatMoney(planned)}
                  </span>
                </Link>
              );
            })}
            {songs.length === 0 && <p className="text-neutral-500 text-sm">Sin presupuestos todavía.</p>}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold mb-3">Ideas de marketing</h2>
          <div className="space-y-2">
            {ideas.map((idea) => (
              <Link
                key={idea.id}
                href={`/songs/${idea.songId}#marketing`}
                className="flex items-center justify-between gap-3 text-sm hover:bg-neutral-900 rounded-lg px-2 py-2 -mx-2"
              >
                <div>
                  <div className="font-medium">{idea.title}</div>
                  <div className="text-xs text-neutral-500">
                    {idea.channel && <span>{idea.channel} · </span>}
                    {idea.song.title}
                  </div>
                </div>
                <TaskStatusBadge status={idea.status} />
              </Link>
            ))}
            {ideas.length === 0 && <p className="text-neutral-500 text-sm">Sin ideas todavía.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
