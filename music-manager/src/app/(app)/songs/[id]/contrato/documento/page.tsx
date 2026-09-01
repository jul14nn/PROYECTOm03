import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { SPLIT_KINDS, total, porcentajeTexto, type SplitKind } from "@/lib/contracts";
import { ArrowLeft } from "lucide-react";
import PrintClient from "@/components/PrintClient";
import SendAgreement from "@/components/SendAgreement";

const FECHA = new Intl.DateTimeFormat("es-ES", { dateStyle: "long" });

export default async function DocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const song = await prisma.song.findFirst({
    where: { id, userId },
    include: { royalties: { include: { contact: true }, orderBy: { percentage: "desc" } } },
  });
  if (!song) notFound();

  const partes = song.royalties.map((r) => ({
    ...r,
    kind: r.kind as SplitKind,
  }));
  const firmantes = Array.from(
    new Map(partes.filter((p) => p.contact).map((p) => [p.contact!.id, p.contact!])).values()
  );
  const hayMaster = partes.some((p) => p.kind === "MASTER");
  const fecha = song.agreementDate ? FECHA.format(song.agreementDate) : "____________________";
  const lugar = song.agreementPlace ?? "____________________";

  return (
    <div className="max-w-3xl">
      {/* Barra de acciones: no se imprime */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link
          href={`/songs/${song.id}/contrato`}
          className="text-sm text-neutral-500 hover:text-neutral-300 flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Volver al cuestionario
        </Link>
        <div className="flex flex-wrap items-start gap-3">
          <SendAgreement
            songId={song.id}
            destinatarios={firmantes.filter((c) => c.email).map((c) => c.email!)}
            enviadoEl={song.agreementSentAt ? FECHA.format(song.agreementSentAt) : null}
          />
          <PrintClient />
        </div>
      </div>

      <p className="no-print text-xs text-neutral-600 mb-4">
        Usa «Imprimir» y elige «Guardar como PDF». Imprime una copia por
        firmante: cada uno debe quedarse con la suya firmada por todos.
      </p>

      {/* ------------------------------------------------------ Documento */}
      <article className="documento">
        <h1>Acuerdo de reparto de derechos</h1>

        <p className="doc-meta">
          Obra musical: <strong>{song.title}</strong>
          {song.genre && <> · {song.genre}</>}
          {song.isrc && (
            <>
              <br />
              ISRC de la grabación: <strong>{song.isrc}</strong>
            </>
          )}
        </p>

        <p>
          En {lugar}, a {fecha}, las personas que se identifican al final de
          este documento acuerdan que la participación de cada una en los
          derechos de la obra musical arriba indicada es la que se detalla a
          continuación.
        </p>

        {SPLIT_KINDS.map((k) => {
          const lineas = partes.filter((p) => p.kind === k.id);
          if (lineas.length === 0) return null;
          return (
            <section key={k.id}>
              <h2>
                {k.id === "OBRA"
                  ? "1. Reparto de la obra (composición)"
                  : "2. Reparto del máster (grabación)"}
              </h2>
              <p className="doc-nota">
                {k.id === "OBRA"
                  ? "Corresponde a la letra y la música. Se devenga cada vez que la obra se comunica públicamente o se reproduce, en esta o en cualquier otra versión."
                  : "Corresponde a esta grabación concreta. Se devenga por la explotación de este fonograma en particular."}
              </p>
              {/* La tabla no cabe en un móvil: se desplaza dentro de su caja
                  en vez de estirar la página. Al imprimir vuelve a ser una
                  tabla normal, que es donde importa que se vea entera. */}
              <div className="tabla-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>DNI / NIE</th>
                    <th>Función</th>
                    <th>Entidad</th>
                    <th className="num">Participación</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((p) => (
                    <tr key={p.id}>
                      <td>{p.contact?.legalName ?? p.name}</td>
                      <td>{p.contact?.taxId ?? "—"}</td>
                      <td>{p.role ?? "—"}</td>
                      <td>
                        {p.contact?.society ?? "—"}
                        {p.contact?.ipi && ` (${p.contact.ipi})`}
                      </td>
                      <td className="num">{porcentajeTexto(p.percentage)}</td>
                    </tr>
                  ))}
                  <tr className="total">
                    <td colSpan={4}>Total</td>
                    <td className="num">{porcentajeTexto(total(
                      partes.map((p) => ({
                        id: p.id, name: p.name, role: p.role,
                        kind: p.kind, percentage: p.percentage, contacto: null,
                      })),
                      k.id
                    ))}</td>
                  </tr>
                </tbody>
              </table>
              </div>
              {lineas.some((p) => p.contact?.publisher) && (
                <p className="doc-nota">
                  Participaciones sujetas a contrato de edición:{" "}
                  {lineas
                    .filter((p) => p.contact?.publisher)
                    .map((p) => `${p.contact!.legalName ?? p.name} — ${p.contact!.publisher}`)
                    .join("; ")}
                  .
                </p>
              )}
            </section>
          );
        })}

        <section>
          <h2>{hayMaster ? "3" : "2"}. Condiciones</h2>
          <ol>
            <li>
              Los porcentajes anteriores son firmes y solo pueden modificarse
              por acuerdo escrito de todas las personas firmantes.
            </li>
            <li>
              Cada firmante declara que su aportación es original y que no
              infringe derechos de terceros.
            </li>
            <li>
              Cada firmante autoriza a las demás a registrar la obra y a
              explotarla conforme a este reparto, y se compromete a facilitar
              los datos que su entidad de gestión requiera.
            </li>
            <li>
              Los gastos de producción, distribución y promoción no están
              incluidos en este acuerdo salvo que se pacten por escrito aparte.
            </li>
            <li>
              Este documento refleja la voluntad de las partes en la fecha
              indicada y se firma en tantos ejemplares como firmantes.
            </li>
          </ol>
        </section>

        <section className="firmas">
          <h2>Firmas</h2>
          <div className="firma-grid">
            {firmantes.map((c) => (
              <div key={c.id} className="firma">
                <div className="linea" />
                <div className="firma-nombre">{c.legalName ?? c.name}</div>
                <div className="firma-datos">
                  {c.taxId ?? "—"}
                  {c.address && (
                    <>
                      <br />
                      {c.address}
                    </>
                  )}
                  {c.email && (
                    <>
                      <br />
                      {c.email}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="doc-pie">
          Documento privado entre las partes. No sustituye al asesoramiento
          jurídico ni al alta de la obra en la entidad de gestión
          correspondiente.
        </p>
      </article>
    </div>
  );
}
