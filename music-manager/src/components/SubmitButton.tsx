"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

/**
 * Botón de envío que se desactiva y avisa mientras la acción está en curso.
 *
 * Sin esto, al pulsar «Guardar» no pasaba nada visible hasta que el servidor
 * respondía, así que en una conexión lenta la reacción natural es volver a
 * pulsar — y se crean entradas duplicadas.
 */
export default function SubmitButton({
  children,
  pendingLabel,
  className = "btn btn-primary",
  icon,
  confirm,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  icon?: React.ReactNode;
  /** Si se indica, se pide confirmación antes de enviar. */
  confirm?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={clsx(className, pending && "opacity-70 cursor-wait")}
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : icon}
      {pending ? (pendingLabel ?? "Guardando…") : children}
    </button>
  );
}

/** Variante compacta para los iconos de borrar dentro de listas. */
export function IconSubmit({
  children,
  className,
  label,
  confirm,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
  confirm?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      title={label}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={clsx(className, pending && "opacity-50 cursor-wait")}
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : children}
    </button>
  );
}
