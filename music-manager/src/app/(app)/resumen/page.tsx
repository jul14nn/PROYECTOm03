import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { STAGES } from "@/lib/constants";
import { buildTodayList, upcomingReleases, songsWithBrokenRoyalties } from "@/lib/agenda";
import Hilo from "@/components/dashboards/Hilo";
import type { DashboardData } from "@/components/dashboards/types";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [songs, upcomingEvents] = await Promise.all([
    prisma.song.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        tasks: true,
        launchTasks: true,
        royalties: true,
        references: true,
      },
    }),
    prisma.calendarEvent.findMany({
      where: { userId, startDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 5,
      include: { song: true },
    }),
  ]);

  const data: DashboardData = {
    todo: buildTodayList(songs),
    releases: upcomingReleases(songs),
    byStage: STAGES.map((s) => ({
      stage: s,
      count: songs.filter((song) => song.stage === s).length,
    })),
    totalSongs: songs.length,
    brokenRoyalties: songsWithBrokenRoyalties(songs),
    missingCover: songs.filter((s) => s.needsCover).length,
    // El coste sale del plan de lanzamiento: cada paso trae el suyo, y
    // "gastado" son los que ya has dado por hechos. Antes venía de un
    // presupuesto que se rellenaba a mano en cada canción.
    totalPlanned: songs
      .flatMap((s) => s.launchTasks)
      .reduce((a, t) => a + (t.cost ?? 0), 0),
    totalActual: songs
      .flatMap((s) => s.launchTasks)
      .filter((t) => t.status === "HECHO")
      .reduce((a, t) => a + (t.cost ?? 0), 0),
    events: upcomingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      startDate: e.startDate,
      songTitle: e.song?.title ?? null,
    })),
  };

  return <Hilo data={data} />;
}
