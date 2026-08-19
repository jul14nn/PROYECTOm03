import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/constants";
import { StageBadge, ColorDot } from "@/components/Badges";
import { ImageOff, Plus, Users2 } from "lucide-react";

export default async function SongsPage() {
  const songs = await prisma.song.findMany({
    orderBy: { updatedAt: "desc" },
    include: { featurings: true, producers: { include: { contact: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Canciones</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Todo tu catálogo: tipo, etapa, featuring, productores y portada.
          </p>
        </div>
        <Link href="/songs/new" className="btn btn-primary">
          <Plus size={16} /> Nueva canción
        </Link>
      </div>

      {songs.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          Todavía no hay canciones.{" "}
          <Link href="/songs/new" className="text-indigo-400 hover:underline">
            Crea la primera
          </Link>
          .
        </div>
      ) : (
        <div className="card divide-y divide-neutral-800 overflow-hidden">
          {songs.map((song) => (
            <Link
              key={song.id}
              href={`/songs/${song.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-900/60 transition-colors"
            >
              <ColorDot color={song.color} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{song.title}</span>
                  {song.needsCover && (
                    <span title="Falta portada">
                      <ImageOff size={14} className="text-pink-400 shrink-0" />
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2 flex-wrap">
                  {song.genre && <span>{song.genre}</span>}
                  {song.featurings.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users2 size={12} />
                      {song.featurings.map((f) => f.artistName).join(", ")}
                    </span>
                  )}
                  {song.producers.length > 0 && (
                    <span>Prod: {song.producers.map((p) => p.contact.name).join(", ")}</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-neutral-500 hidden sm:block">
                {formatDate(song.releaseDate)}
              </div>
              <StageBadge stage={song.stage} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
