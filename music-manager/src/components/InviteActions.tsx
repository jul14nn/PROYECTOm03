"use client";

import { useState, useTransition } from "react";
import { sendInvite, sendAllPendingInvites } from "@/lib/actions/calendar";
import { Send, Loader2 } from "lucide-react";

export function SendInviteButton({ eventId, inviteId }: { eventId: string; inviteId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        className="btn btn-secondary text-xs py-1"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await sendInvite(eventId, inviteId);
            if (!res.ok) setError(res.error);
          })
        }
      >
        {pending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        Enviar
      </button>
      {error && <span className="text-xs text-red-400 max-w-[16rem] text-right">{error}</span>}
    </div>
  );
}

export function SendAllButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className="btn btn-primary text-sm"
        onClick={() =>
          startTransition(async () => {
            setMessage(null);
            const res = await sendAllPendingInvites(eventId);
            if (!res.emailConfigured) {
              setMessage("SMTP no configurado: añade SMTP_HOST, SMTP_USER y SMTP_PASS en .env");
              return;
            }
            const failed = res.results.filter((r) => !r.ok).length;
            setMessage(
              failed === 0
                ? `Invitaciones enviadas (${res.results.length}).`
                : `${res.results.length - failed} enviadas, ${failed} fallidas.`
            );
          })
        }
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        Enviar todas las pendientes
      </button>
      {message && <span className="text-xs text-neutral-400">{message}</span>}
    </div>
  );
}
