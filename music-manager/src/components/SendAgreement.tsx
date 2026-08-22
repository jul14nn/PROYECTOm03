"use client";

import { useState, useTransition } from "react";
import { Mail, Loader2, Check, AlertTriangle } from "lucide-react";
import { sendAgreement } from "@/lib/actions/contracts";

/**
 * Enviar el acuerdo es irreversible en la práctica: un correo no se recoge.
 * Por eso pide confirmación, y por eso muestra el resultado en pantalla en
 * vez de dejar a la persona adivinando si salió.
 */
export default function SendAgreement({
  songId,
  destinatarios,
  enviadoEl,
}: {
  songId: string;
  destinatarios: string[];
  enviadoEl: string | null;
}) {
  const [pendiente, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null);

  const lista = destinatarios.join(", ");

  return (
    <div>
      <button
        type="button"
        disabled={pendiente || destinatarios.length === 0}
        onClick={() => {
          const aviso = enviadoEl
            ? `Ya se envió el ${enviadoEl}. ¿Volver a enviarlo a ${lista}?`
            : `Se enviará el acuerdo a ${lista}. ¿Continuar?`;
          if (!confirm(aviso)) return;
          startTransition(async () => {
            setResultado(await sendAgreement(songId));
          });
        }}
        className="btn btn-secondary"
        aria-busy={pendiente}
      >
        {pendiente ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
        {pendiente ? "Enviando…" : enviadoEl ? "Volver a enviar" : "Enviar a los firmantes"}
      </button>

      {destinatarios.length === 0 && (
        <p className="text-xs text-amber-300/80 mt-2">
          Ningún firmante tiene email guardado.
        </p>
      )}

      {enviadoEl && !resultado && (
        <p className="text-xs text-neutral-500 mt-2">Enviado el {enviadoEl}.</p>
      )}

      {resultado && (
        <p
          className={`text-sm mt-2 flex items-start gap-1.5 ${
            resultado.ok ? "text-emerald-400" : "text-amber-300"
          }`}
        >
          {resultado.ok ? (
            <Check size={14} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          )}
          {resultado.mensaje}
        </p>
      )}
    </div>
  );
}
