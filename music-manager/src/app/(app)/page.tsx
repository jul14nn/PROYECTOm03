import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { STAGES } from "@/lib/constants";
import { buildTodayList, upcomingReleases, songsWithBrokenRoyalties } from "@/lib/agenda";
import Hilo from "@/components/dashboards/Hilo";
import type { DashboardData } from "@/components/dashboards/types";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [songs, upcomingEvents, budgets] = await Promise.all([
    prisma.song.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        tasks: true,
        distributionSteps: true,
        marketingIdeas: true,
        marketingBudgets: true,
        royalties: true,
        videoIdeas: true,
        references: true,
      },
    }),
    prisma.calendarEvent.findMany({
      where: { userId, startDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 5,
      include: { song: true },
    }),
    prisma.marketingBudgetItem.findMany({ where: { song: { userId } } }),
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
    totalPlanned: budgets.reduce((a, b) => a + b.plannedAmount, 0),
    totalActual: budgets.reduce((a, b) => a + b.actualAmount, 0),
    events: upcomingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      startDate: e.startDate,
      songTitle: e.song?.title ?? null,
    })),
  };

  return <Hilo data={data} />;
}
