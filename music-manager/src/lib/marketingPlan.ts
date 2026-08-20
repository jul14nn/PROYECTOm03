import { daysUntil, tiktokPlanFor } from "@/lib/tiktokPlan";

export function defaultMarketingPlan(releaseDate: Date | null) {
  const days = releaseDate ? daysUntil(releaseDate) : null;
  const plan = days !== null ? tiktokPlanFor(Math.max(days, 0)) : null;

  const ideas: { title: string; channel: string; description: string }[] = [
    {
      title: "Teaser de estudio",
      channel: "TikTok",
      description: "Clip corto grabando o mezclando, sin enseñar el gancho todavía.",
    },
    {
      title: plan ? `TikTok: ${plan.cadence}` : "Adelanto del hook",
      channel: "TikTok",
      description: plan ? plan.focus : "Publica un fragmento del estribillo.",
    },
    {
      title: "Anuncio de fecha",
      channel: "Instagram",
      description: "Post fijo con la fecha aproximada y el arte de portada.",
    },
    {
      title: "Detrás de cámaras",
      channel: "Instagram",
      description: "Reel del proceso de grabación o composición.",
    },
    {
      title: "Activar pre-guardado",
      channel: "Spotify / Apple Music",
      description: "Actívalo al menos 7 días antes del lanzamiento.",
    },
  ];

  const budgets: { category: string; plannedAmount: number }[] = [
    { category: "Ads (Meta/TikTok)", plannedAmount: 150 },
    { category: "Playlisting", plannedAmount: 80 },
  ];

  return { ideas, budgets };
}
