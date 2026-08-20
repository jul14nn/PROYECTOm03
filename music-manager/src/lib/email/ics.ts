/**
 * Genera el adjunto .ics de un evento.
 *
 * Es lo que convierte "te ha llegado un correo" en "está en mi calendario":
 * Gmail, Apple y Outlook detectan text/calendar y ofrecen añadirlo con un
 * toque. Sin esto, el invitado tiene que copiar la fecha a mano.
 */

function icsDate(d: Date) {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Escapado del formato: coma, punto y coma y saltos de línea son especiales. */
function esc(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => `\\${m}`).replace(/\r?\n/g, "\\n");
}

/** Las líneas de un .ics no deben pasar de 75 octetos; se pliegan con espacio. */
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function buildEventIcs(event: {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
}) {
  // Sin hora de fin, se asume una hora: mejor un bloque razonable que un
  // evento de duración cero que algunos calendarios pintan raro.
  const end = event.endDate ?? new Date(event.startDate.getTime() + 60 * 60 * 1000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Music Manager//ES",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@music-manager`,
    `DTSTAMP:${icsDate(new Date())}`,
    // SEQUENCE crece con cada reenvío: así el calendario del invitado
    // actualiza el evento en vez de duplicarlo (el UID no cambia).
    `SEQUENCE:${Math.floor(Date.now() / 1000) % 100000000}`,
    `DTSTART:${icsDate(event.startDate)}`,
    `DTEND:${icsDate(end)}`,
    fold(`SUMMARY:${esc(event.title)}`),
    ...(event.location ? [fold(`LOCATION:${esc(event.location)}`)] : []),
    ...(event.description ? [fold(`DESCRIPTION:${esc(event.description)}`)] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
