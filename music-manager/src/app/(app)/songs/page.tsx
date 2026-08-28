import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { formatDateApprox } from "@/lib/constants";
import { daysUntil } from "@/lib/tiktokPlan";
import SongsBrowser, { type SongRow } from "@/components/SongsBrowser";

export default async function SongsPage() {
  const userId = await requireUserId();
  const songs = await prisma.song.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { featurings: true, producers: { include: { contact: true } } },
  });

  const rows: SongRow[] = songs.map((song) => ({
    id: song.id,
    title: song.title,
    genre: song.genre,
    color: song.color,
    stage: song.stage,
    needsCover: song.needsCover,
    coverUrl: song.coverUrl,
    releaseLabel: formatDateApprox(song.releaseDate),
    daysToRelease: song.releaseDate ? daysUntil(song.releaseDate) : null,
    featurings: song.featurings.map((f) => f.artistName),
    producers: song.producers.map((p) => p.contact.name),
  }));

  return (
    <div className="space-y-6">
      <div>
        <div>
          <div className="eyebrow mb-2">Catálogo</div>
          <h1 className="display-title text-5xl sm:text-6xl">Canciones</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Todo tu catálogo: tipo, etapa, featuring, productores y portada.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          Todavía no hay canciones.{" "}
          <Link href="/songs/new" className="text-[var(--accent-soft)] hover:underline">
            Crea la primera
          </Link>
          .
        </div>
      ) : (
        <SongsBrowser songs={rows} />
      )}
    </div>
  );
}
