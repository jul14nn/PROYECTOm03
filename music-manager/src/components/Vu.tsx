/**
 * Medidor VU segmentado: progreso que se enciende, como en la mesa de mezclas.
 * Hereda `--song` del contenedor si está definido. Componente de servidor.
 */
export default function Vu({
  value,
  segments = 24,
  className,
  label,
}: {
  /** 0..1 */
  value: number;
  segments?: number;
  className?: string;
  label?: string;
}) {
  const lit = Math.round(Math.max(0, Math.min(1, value)) * segments);
  return (
    <div
      className={`vu ${className ?? ""}`}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} {...(i < lit ? { "data-on": "" } : {})} />
      ))}
    </div>
  );
}
