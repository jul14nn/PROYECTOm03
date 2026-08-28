import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAppEmail, isEmailConfigured } from "@/lib/email/mailer";
import { REMINDER_THRESHOLDS, daysUntil, tiktokPlanFor } from "@/lib/tiktokPlan";
import { STAGE_LABELS, type Stage } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // sin CRON_SECRET configurado, no se puede verificar (ver README)
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const songs = await prisma.song.findMany({
    where: { releaseDate: { not: null }, stage: { not: "LANZADA" } },
    include: { user: true },
  });

  let sent = 0;
  let skippedNoSmtp = 0;

  for (const song of songs) {
    if (!song.releaseDate || !song.user.email) continue;

    const days = daysUntil(song.releaseDate);
    const eligible = REMINDER_THRESHOLDS.filter((t) => days <= t);
    if (eligible.length === 0) continue;

    const target = Math.min(...eligible);
    if (song.lastReminderThreshold !== null && song.lastReminderThreshold <= target) continue;

    if (!isEmailConfigured()) {
      skippedNoSmtp++;
      continue;
    }

    const plan = tiktokPlanFor(days);
    const dayLabel = days === 1 ? "1 día" : days <= 0 ? "muy pocos días" : `${days} días`;

    await sendAppEmail({
      to: song.user.email,
      subject: `"${song.title}" se acerca a su fecha aproximada (${dayLabel})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.55;">
          <h2>${song.title}</h2>
          <p>Quedan aproximadamente <strong>${dayLabel}</strong> para la fecha que marcaste
          (recuerda: es orientativa, no un compromiso cerrado). Etapa actual:
          <strong>${STAGE_LABELS[song.stage as Stage] ?? song.stage}</strong>.</p>
          <h3 style="margin-top:1.25rem;">Plan de TikTok sugerido</h3>
          <p><strong>${plan.cadence}</strong></p>
          <p>${plan.focus}</p>
        </div>
      `,
    });

    await prisma.song.update({ where: { id: song.id }, data: { lastReminderThreshold: target } });
    sent++;
  }

  return NextResponse.json({ ok: true, checked: songs.length, sent, skippedNoSmtp });
}
