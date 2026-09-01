import type { AgendaItem, UpcomingRelease } from "@/lib/agenda";
import type { Stage } from "@/lib/constants";

export type DashboardData = {
  todo: AgendaItem[];
  releases: UpcomingRelease[];
  byStage: { stage: Stage; count: number }[];
  totalSongs: number;
  brokenRoyalties: number;
  missingCover: number;
  totalPlanned: number;
  totalActual: number;
  events: {
    id: string;
    title: string;
    startDate: Date;
    songTitle: string | null;
  }[];
};
