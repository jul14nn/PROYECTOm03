import { SPLIT_KINDS, porcentajeTexto, type SplitKind } from "@/lib/contracts";

/**
 * El acuerdo, en HTML de correo.
 *
 * Va entero en el cuerpo, no como enlace: quien firma no tiene cuenta en la
 * app, y un acuerdo que solo existe detrás de un login no le sirve de nada a
 * la persona que lo tiene que guardar. El correo ES su copia.
 *
 * Estilos en línea y tablas: es lo único que respetan todos los clientes.
 */

type Linea = {
  id: string;
  name: string;
  role: string | null;
  kind: SplitKind;
  percentage: number;
  contact: { legalName: string | null; taxId: string | null; society: string | null } | null;
};

export function agreementEmailHtml(opts: {
  songTitle: string;
  genre: string | null;
  isrc: string | null;
  lugar: string;
  fecha: string;
  lineas: Linea[];
  remitente: string;
}) {
  const { songTitle, genre, isrc, lugar, fecha, lineas, remitente } = opts;

  const tabla = (kind: SplitKind) => {
    const filas = lineas.filter((l) => l.kind === kind);
    if (filas.length === 0) return "";
    const meta = SPLIT_KINDS.find((k) => k.id === kind)!;
    const total = filas.reduce((a, l) => a + l.percentage, 0);
    return `
      <h3 style="font:600 15px/1.4 Georgia,serif;margin:26px 0 4px;color:#16141a;">${meta.name}</h3>
      <p style="font:13px/1.5 Georgia,serif;color:#55505c;margin:0 0 10px;">${meta.description}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font:13px/1.5 Georgia,serif;color:#16141a;">
        <tr style="background:#f0ede6;">
          <th align="left" style="padding:7px 9px;border:1px solid #cfcabf;font-size:11px;letter-spacing:.05em;text-transform:uppercase;">Nombre</th>
          <th align="left" style="padding:7px 9px;border:1px solid #cfcabf;font-size:11px;letter-spacing:.05em;text-transform:uppercase;">DNI / NIE</th>
          <th align="left" style="padding:7px 9px;border:1px solid #cfcabf;font-size:11px;letter-spacing:.05em;text-transform:uppercase;">Función</th>
          <th align="right" style="padding:7px 9px;border:1px solid #cfcabf;font-size:11px;letter-spacing:.05em;text-transform:uppercase;">Participación</th>
        </tr>
        ${filas
          .map(
            (l) => `<tr>
          <td style="padding:7px 9px;border:1px solid #cfcabf;">${escapar(l.contact?.legalName ?? l.name)}</td>
          <td style="padding:7px 9px;border:1px solid #cfcabf;">${escapar(l.contact?.taxId ?? "—")}</td>
          <td style="padding:7px 9px;border:1px solid #cfcabf;">${escapar(l.role ?? "—")}</td>
          <td align="right" style="padding:7px 9px;border:1px solid #cfcabf;white-space:nowrap;">${porcentajeTexto(l.percentage)}</td>
        </tr>`
          )
          .join("")}
        <tr style="background:#f6f4ef;font-weight:700;">
          <td colspan="3" style="padding:7px 9px;border:1px solid #cfcabf;">Total</td>
          <td align="right" style="padding:7px 9px;border:1px solid #cfcabf;">${porcentajeTexto(Math.round(total * 100) / 100)}</td>
        </tr>
      </table>`;
  };

  return `
  <div style="background:#f4f2ee;padding:28px 12px;">
    <div style="max-width:640px;margin:0 auto;background:#fdfdfb;padding:34px 34px 30px;border-radius:6px;">
      <h1 style="font:700 21px/1.3 Georgia,serif;color:#16141a;margin:0 0 6px;text-align:center;">Acuerdo de reparto de derechos</h1>
      <p style="font:15px/1.5 Georgia,serif;color:#16141a;margin:0 0 20px;text-align:center;padding-bottom:16px;border-bottom:1px solid #d9d5cc;">
        <strong>${escapar(songTitle)}</strong>${genre ? ` · ${escapar(genre)}` : ""}
        ${isrc ? `<br><span style="font-size:13px;color:#55505c;">ISRC: ${escapar(isrc)}</span>` : ""}
      </p>

      <p style="font:14px/1.6 Georgia,serif;color:#16141a;">
        ${escapar(remitente)} te envía el reparto acordado de esta canción, para que tengas
        constancia de él. En ${escapar(lugar)}, a ${escapar(fecha)}.
      </p>

      ${tabla("OBRA")}
      ${tabla("MASTER")}

      <p style="font:14px/1.6 Georgia,serif;color:#16141a;margin-top:26px;">
        Si algo no coincide con lo que recordáis, decidlo <strong>ahora</strong>:
        corregirlo hoy es un mensaje, y dentro de dos años es un problema.
        Si estás de acuerdo, responde a este correo confirmándolo y guarda el
        mensaje.
      </p>

      <p style="font:12px/1.5 Georgia,serif;color:#6b6674;margin-top:24px;padding-top:14px;border-top:1px solid #d9d5cc;">
        Documento privado entre las partes. No sustituye al asesoramiento
        jurídico ni al alta de la obra en la entidad de gestión correspondiente.
      </p>
    </div>
  </div>`;
}

/** El nombre de alguien puede llevar & o comillas; sin escapar rompería el HTML. */
function escapar(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
