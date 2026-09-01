/**
 * Forma de onda decorativa, determinista por canción.
 *
 * No hay audio real detrás: es la firma visual de la canción, generada de su
 * id para que siempre sea la misma. Una app de música puede permitirse que
 * sus líneas divisorias sean ondas y no rayas.
 *
 * Componente de servidor: SVG puro, cero JS en el cliente.
 */

/* mulberry32: generador pequeño y estable; la gracia es que la misma
   canción produce siempre la misma onda. */
function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function Waveform({
  seed,
  color,
  bars = 56,
  className,
  opacity = 0.5,
  style,
}: {
  seed: string;
  color: string;
  bars?: number;
  className?: string;
  opacity?: number;
  style?: React.CSSProperties;
}) {
  const rnd = seeded(seed);
  const W = bars * 5;
  const H = 40;
  const mid = H / 2;

  const heights: number[] = [];
  for (let i = 0; i < bars; i++) {
    // Dos ondas lentas + ruido: se parece a una canción (estrofa/estribillo),
    // no a estática de televisión.
    const phase = (i / bars) * Math.PI * 2;
    const macro = 0.45 + 0.3 * Math.sin(phase * 1.7 + rnd() * 2) + 0.25 * Math.sin(phase * 3.3);
    const h = Math.max(0.08, Math.min(1, macro * (0.55 + rnd() * 0.6)));
    // Redondeo a 2 decimales: el servidor y el cliente serializan los
    // flotantes largos con distinta precisión y React lo marca como
    // hidratación rota. Con 2 decimales ambos escriben lo mismo.
    heights.push(Math.round(h * (H * 0.92) * 100) / 100);
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      style={{ opacity, ...style }}
      aria-hidden
    >
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * 5 + 1}
          y={Math.round((mid - h / 2) * 100) / 100}
          width={3}
          height={h}
          rx={1.5}
          fill={color}
          opacity={Math.round((0.35 + (h / H) * 0.65) * 100) / 100}
        />
      ))}
    </svg>
  );
}
