"use client";

import { useState } from "react";

/**
 * Funda del disco. La portada en blanco no es solo para cuando falta: también
 * cubre el caso de que la URL exista pero no cargue (enlace roto, caducado o
 * mal escrito), que con una etiqueta de imagen normal deja un icono de rota.
 */
export default function Sleeve({
  coverUrl,
  title,
  missing,
}: {
  coverUrl: string | null;
  title: string;
  missing: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const blank = missing || !coverUrl || failed;

  if (blank) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ background: "linear-gradient(150deg,#eceae4,#cfccc4)" }}
      >
        <span
          className="poster text-center leading-tight px-3"
          style={{ color: "#8d897f", fontSize: "0.7rem", letterSpacing: "0.18em" }}
        >
          SIN
          <br />
          PORTADA
        </span>
        <span
          className="absolute bottom-3 left-3 right-3 text-[0.55rem] text-center truncate"
          style={{ color: "#a5a199" }}
        >
          {title}
        </span>
        {failed && !missing && (
          <span
            className="absolute top-3 left-3 text-[0.5rem] uppercase tracking-wider"
            style={{ color: "#b9534a" }}
          >
            enlace roto
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl}
        alt={`Portada de ${title}`}
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.75) 100%)" }}
      />
    </>
  );
}
