import { getNextStep, type NextStep } from "./nextStep";
import { daysUntil, tiktokPlanFor, type TiktokPlan } from "./tiktokPlan";

type AgendaSong = {
  id: string;
  title: string;
  color: string;
  needsCover: boolean;
  releaseDate: Date | null;
  stage: string;
  tasks: { status: string }[];
  distributionSteps: { status: string }[];
  marketingIdeas: { status: string }[];
  marketingBudgets: unknown[];
  royalties: { percentage: number }[];
  videoIdeas: unknown[];
  references: unknown[];
};

export type AgendaItem = {
  songId: string;
  songTitle: string;
  color: string;
  step: NextStep;
};

/**
 * Junta el "próximo paso" de todas las canciones en una única lista ordenada
 * por urgencia. Sin esto hay que abrir canción por canción para saber qué
 * está pendiente, que era la queja principal al usar la app de verdad.
 */
export function buildTodayList(songs: AgendaSong[]): AgendaItem[] {
  return songs
    .map((song) => ({
      songId: song.id,
      songTitle: song.title,
      color: song.color,
      step: getNextStep(song),
    }))
    .filter((item) => !item.step.done)
    .sort((a, b) => b.step.priority - a.step.priority);
}

export type UpcomingRelease = {
  songId: string;
  songTitle: string;
  color: string;
  releaseDate: Date;
  days: number;
  tiktok: TiktokPlan;
};

/**
 * Canciones que se acercan a su fecha aproximada, con los días que faltan y
 * cuántas sesiones de TikTok tocan esta semana.
 */
export function upcomingReleases(
  songs: AgendaSong[],
  withinDays = 60
): UpcomingRelease[] {
  return songs
    .filter((s) => s.releaseDate !== null && s.stage !== "LANZADA")
    .map((s) => {
      const releaseDate = s.releaseDate as Date;
      const days = daysUntil(releaseDate);
      return {
        songId: s.id,
        songTitle: s.title,
        color: s.color,
        releaseDate,
        days,
        tiktok: tiktokPlanFor(days),
      };
    })
    .filter((r) => r.days <= withinDays)
    .sort((a, b) => a.days - b.days);
}

/** Canciones cuyos royalties no suman 100% (incluye las que no tienen ninguno). */
export function songsWithBrokenRoyalties(songs: AgendaSong[]): number {
  return songs.filter((s) => {
    const total = s.royalties.reduce((a, r) => a + r.percentage, 0);
    return total !== 100;
  }).length;
}
