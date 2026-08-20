import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { formatMoney } from "@/lib/constants";
import { ColorDot } from "@/components/Badges";

export default async function RoyaltiesPage() {
  const userId = await requireUserId();
  const songs = await prisma.song.findMany({
    where: { userId, royalties: { some: {} } },
    include: { royalties: { include: { payments: true }, orderBy: { createdAt: "asc" } } },
    orderBy: { title: "asc" },
  });

  const totalPaid = songs
    .flatMap((s) => s.royalties)
    .flatMap((r) => r.payments)
    .reduce((a, p) => a + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="eyebrow mb-2">Reparto</div>
          <h1 className="display-title text-5xl sm:text-6xl">Royalties</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Splits por canción y pagos registrados. Total pagado: {formatMoney(totalPaid)}.
        </p>
      </div>

      {songs.length === 0 && (
        <div className="card p-10 text-center text-neutral-500">
          Todavía no hay royalties registrados. Añádelos desde la ficha de cada canción.
        </div>
      )}

      <div className="space-y-4">
        {songs.map((song) => {
          const total = song.royalties.reduce((a, r) => a + r.percentage, 0);
          const paid = song.royalties.flatMap((r) => r.payments).reduce((a, p) => a + p.amount, 0);
          return (
            <div key={song.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <Link href={`/songs/${song.id}#royalties`} className="flex items-center gap-2 font-medium hover:underline">
                  <ColorDot color={song.color} /> {song.title}
                </Link>
                <div className="text-xs text-neutral-500">
                  {total}% repartido · {formatMoney(paid)} pagado
                </div>
              </div>
              <div className="space-y-1">
                {song.royalties.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span>
                      {r.name} {r.role && <span className="text-neutral-500">· {r.role}</span>}
                    </span>
                    <span className="text-neutral-400">{r.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
