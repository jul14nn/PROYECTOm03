import { LAUNCH_STEPS, PHASES, type PhaseId } from "./launchPlan";
import { daysUntil } from "./tiktokPlan";

/**
 * Extensión en días de cada fase, deducida del propio playbook en vez de
 * escrita a mano: si mañana se añade un paso en D-70, la vista se estira sola.
 */
export const PHASE_SPANS: { id: PhaseId; name: string; from: number; to: number }[] =
  PHASES.map((p) => {
    const days = LAUNCH_STEPS.filter((s) => s.phase === p.id).map((s) => s.day);
    return { id: p.id, name: p.name, from: Math.min(...days), to: Math.max(...days) };
  });

export const CAMPAIGN_FROM = Math.min(...PHASE_SPANS.map((p) => p.from));
export const CAMPAIGN_TO = Math.max(...PHASE_SPANS.map((p) => p.to));

/** Ventana intensa: la semana previa y la siguiente al lanzamiento. */
const INTENSE_FROM = -7;
const INTENSE_TO = 7;

export type CampaignSong = {
  id: string;
  title: string;
  color: string;
  stage: string;
  needsCover: boolean;
  coverUrl: string | null;
  releaseDate: Date | null;
  launchTasks: { status: string; phase: string }[];
};

export type Campaign = {
  songId: string;
  title: string;
  color: string;
  stage: string;
  needsCover: boolean;
  coverUrl: string | null;
  /** Días desde hoy hasta el lanzamiento. */
  releaseIn: number;
  releaseDate: Date;
  /** Inicio y fin de la campaña, en días desde hoy. */
  from: number;
  to: number;
  intenseFrom: number;
  intenseTo: number;
  done: number;
  total: number;
  /** Ids de otras canciones cuya semana intensa se solapa con la de esta. */
  collidesWith: string[];
};

export function buildCampaigns(songs: CampaignSong[]): Campaign[] {
  const withDate = songs.filter((s) => s.releaseDate !== null);

  const base = withDate.map((s) => {
    const releaseIn = daysUntil(s.releaseDate as Date);
    return {
      songId: s.id,
      title: s.title,
      color: s.color,
      stage: s.stage,
      needsCover: s.needsCover,
      coverUrl: s.coverUrl,
      releaseIn,
      releaseDate: s.releaseDate as Date,
      from: releaseIn + CAMPAIGN_FROM,
      to: releaseIn + CAMPAIGN_TO,
      intenseFrom: releaseIn + INTENSE_FROM,
      intenseTo: releaseIn + INTENSE_TO,
      done: s.launchTasks.filter((t) => t.status === "HECHO").length,
      total: s.launchTasks.length,
      collidesWith: [] as string[],
    };
  });

  // Dos campañas chocan cuando sus semanas intensas se pisan: no puedes llevar
  // dos cuentas atrás a la vez sin quemar a tu público. Esto no se ve en una
  // lista ordenada por fecha, y es la razón de ser de la vista de arreglo.
  for (const a of base) {
    for (const b of base) {
      if (a.songId === b.songId) continue;
      if (a.intenseFrom <= b.intenseTo && b.intenseFrom <= a.intenseTo) {
        a.collidesWith.push(b.songId);
      }
    }
  }

  return base.sort((a, b) => a.releaseIn - b.releaseIn);
}

/** Fases de una campaña concreta, en días desde hoy. */
export function phaseBlocks(c: Campaign) {
  return PHASE_SPANS.map((p) => ({
    id: p.id,
    name: p.name,
    from: c.releaseIn + p.from,
    to: c.releaseIn + p.to,
  }));
}
