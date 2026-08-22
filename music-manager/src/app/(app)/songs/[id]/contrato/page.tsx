import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import SubmitButton from "@/components/SubmitButton";
import {
  SPLIT_KINDS,
  CAMPOS_PERSONA,
  camposQueFaltan,
  bloqueos,
  total,
  sumaCien,
  porcentajeTexto,
  type ParticipanteReparto,
  type SplitKind,
} from "@/lib/contracts";
import {
  saveContactLegal,
  saveAgreementMeta,
  linkRoyaltyToNewContact,
  linkRoyaltyToContact,
  setRoyaltyKind,
  copyObraToMaster,
} from "@/lib/actions/contracts";
import { ArrowLeft, FileText, AlertTriangle, Check, Copy } from "lucide-react";

export default async function ContratoPage({
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

  const contacts = await prisma.contact.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  const participantes: ParticipanteReparto[] = song.royalties.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    kind: r.kind as SplitKind,
    percentage: r.percentage,
    contacto: r.contact
      ? {
          id: r.contact.id,
          name: r.contact.name,
          legalName: r.contact.legalName,
          taxId: r.contact.taxId,
          address: r.contact.address,
          email: r.contact.email,
          society: r.contact.society,
          ipi: r.contact.ipi,
          publisher: r.contact.publisher,
        }
      : null,
  }));

  const problemas = bloqueos(participantes, song.agreementPlace);
  const graves = problemas.filter((p) => p.grave);
  const listo = graves.length === 0;
  const hayMaster = participantes.some((p) => p.kind === "MASTER");

  return (
    <div className="space-y-6 pb-16 max-w-3xl">
      <div>
        <Link
          href={`/songs/${song.id}?tab=royalties`}
          className="text-sm text-neutral-500 hover:text-neutral-300 flex items-center gap-1.5 mb-4"
        >
          <ArrowLeft size={14} /> Volver a la canción
        </Link>
        <div className="eyebrow mb-2">Acuerdo de reparto</div>
        <h1 className="display-title text-4xl sm:text-5xl break-words">{song.title}</h1>
        <p className="text-neutral-400 text-sm mt-3">
          El documento que fija quién cobra qué. Firmarlo el día que termináis
          la canción cuesta cinco minutos; reconstruirlo dos años después,
          cuando ya hay dinero y cada uno recuerda una cosa, es de donde salen
          los líos.
        </p>
      </div>

      {/* ------------------------------------------------ Estado / bloqueos */}
      <div className={`card p-5 ${listo ? "border-emerald-500/30" : "border-amber-500/30"}`}>
        <div className="flex items-start gap-3">
          {listo ? (
            <Check size={18} className="text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium">
              {listo ? "Listo para firmar" : `Faltan ${graves.length} cosas`}
            </div>
            {problemas.length > 0 && (
              <ul className="text-sm text-neutral-400 mt-2 space-y-1">
                {problemas.map((p, i) => (
                  <li key={i} className={p.grave ? "" : "text-neutral-500"}>
                    · {p.texto}
                  </li>
                ))}
              </ul>
            )}
            {listo && (
              <Link href={`/songs/${song.id}/contrato/documento`} className="btn btn-primary mt-4">
                <FileText size={15} /> Ver el documento
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ Los repartos */}
      {SPLIT_KINDS.map((k) => {
        const suma = total(participantes, k.id);
        const lineas = participantes.filter((p) => p.kind === k.id);
        return (
          <div key={k.id} className="card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-semibold">{k.name}</h2>
              <span
                className={`numeral text-lg ${sumaCien(suma) ? "text-emerald-400" : "text-amber-300"}`}
              >
                {porcentajeTexto(suma)}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-1">{k.description}</p>
            <p className="text-xs text-neutral-600 mt-1">Lo gestiona: {k.gestor}</p>

            <div className="mt-4 space-y-2">
              {lineas.map((p) => (
                <div key={p.id} className="tile px-3 py-2.5 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      {p.name}
                      {p.role && <span className="text-neutral-500"> · {p.role}</span>}
                    </div>
                    {p.contacto ? (
                      camposQueFaltan(p.contacto).length > 0 && (
                        <div className="text-xs text-amber-300/80 mt-0.5">
                          Faltan: {camposQueFaltan(p.contacto).join(", ")}
                        </div>
                      )
                    ) : (
                      <div className="text-xs text-amber-300/80 mt-0.5">Sin contacto vinculado</div>
                    )}
                  </div>
                  <span className="numeral text-sm">{porcentajeTexto(p.percentage)}</span>
                  <form
                    action={setRoyaltyKind.bind(
                      null,
                      song.id,
                      p.id,
                      p.kind === "OBRA" ? "MASTER" : "OBRA"
                    )}
                  >
                    <SubmitButton className="btn btn-secondary text-xs py-1" pendingLabel="…">
                      Mover a {p.kind === "OBRA" ? "máster" : "obra"}
                    </SubmitButton>
                  </form>
                </div>
              ))}

              {lineas.length === 0 && (
                <p className="text-sm text-neutral-500">
                  {k.id === "OBRA" ? (
                    <>
                      Sin autores todavía. Añádelos en la{" "}
                      <Link
                        href={`/songs/${song.id}?tab=royalties`}
                        className="text-fuchsia-400 hover:underline"
                      >
                        pestaña de Royalties
                      </Link>
                      .
                    </>
                  ) : (
                    <>
                      Opcional. Solo hace falta si queréis repartir también los
                      ingresos de esta grabación concreta.
                    </>
                  )}
                </p>
              )}

              {k.id === "MASTER" && !hayMaster && participantes.length > 0 && (
                <form action={copyObraToMaster.bind(null, song.id)}>
                  <SubmitButton className="btn btn-secondary" pendingLabel="Copiando…">
                    <Copy size={14} /> Copiar el reparto de obra
                  </SubmitButton>
                </form>
              )}
            </div>
          </div>
        );
      })}

      {/* ------------------------------------------- Datos de cada persona */}
      <div className="card p-6">
        <h2 className="font-semibold">Datos de quienes firman</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Se guardan en el contacto, así que solo hay que escribirlos una vez:
          la próxima canción con esa misma persona ya vendrá completa.
        </p>
        <p className="text-sm text-neutral-500 mt-1">
          ¿No sabes qué poner en «entidad de gestión»?{" "}
          <Link href="/guias/sgae" className="text-fuchsia-400 hover:underline">
            Guía para darse de alta en la SGAE
          </Link>
          .
        </p>

        <div className="mt-5 space-y-5">
          {Array.from(new Map(participantes.map((p) => [p.contacto?.id ?? p.id, p])).values()).map(
            (p) =>
              p.contacto ? (
                <form
                  key={p.contacto.id}
                  action={saveContactLegal.bind(null, p.contacto.id, song.id)}
                  className="tile p-4"
                >
                  <div className="flex items-baseline justify-between gap-3 mb-3">
                    <span className="font-medium text-sm">{p.contacto.name}</span>
                    {camposQueFaltan(p.contacto).length === 0 && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <Check size={12} /> completo
                      </span>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {CAMPOS_PERSONA.map((c) => (
                      <div key={c.key} className={c.key === "address" ? "sm:col-span-2" : ""}>
                        <label className="label" htmlFor={`${p.contacto!.id}-${c.key}`}>
                          {c.label} {c.required && <span className="text-fuchsia-400">*</span>}
                        </label>
                        <input
                          id={`${p.contacto!.id}-${c.key}`}
                          name={c.key}
                          defaultValue={p.contacto![c.key] ?? ""}
                          className="input"
                          type={c.key === "email" ? "email" : "text"}
                        />
                        <p className="text-xs text-neutral-600 mt-1">{c.hint}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <SubmitButton className="btn btn-secondary" pendingLabel="Guardando…">
                      Guardar
                    </SubmitButton>
                  </div>
                </form>
              ) : (
                <div key={p.id} className="tile p-4">
                  <div className="font-medium text-sm mb-1">{p.name}</div>
                  <p className="text-xs text-neutral-500 mb-3">
                    Esta línea no está vinculada a ningún contacto, así que no
                    tiene datos para firmar.
                  </p>

                  {contacts.length > 0 && (
                    <form
                      action={linkRoyaltyToContact.bind(null, song.id, p.id)}
                      className="flex flex-wrap gap-2 mb-3"
                    >
                      <select name="contactId" className="input flex-1 min-w-[10rem]" required>
                        <option value="">Vincular a un contacto que ya existe…</option>
                        {contacts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <SubmitButton className="btn btn-secondary" pendingLabel="Vinculando…">
                        Vincular
                      </SubmitButton>
                    </form>
                  )}

                  <form action={linkRoyaltyToNewContact.bind(null, song.id, p.id)}>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Nombre del contacto</label>
                        <input name="name" defaultValue={p.name} className="input" />
                      </div>
                      <div>
                        <label className="label">Nombre completo (DNI)</label>
                        <input name="legalName" className="input" />
                      </div>
                      <div>
                        <label className="label">DNI / NIE</label>
                        <input name="taxId" className="input" />
                      </div>
                      <div>
                        <label className="label">Email</label>
                        <input name="email" type="email" className="input" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Domicilio</label>
                        <input name="address" className="input" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <SubmitButton className="btn btn-secondary" pendingLabel="Creando…">
                        Crear contacto y vincular
                      </SubmitButton>
                    </div>
                  </form>
                </div>
              )
          )}

          {participantes.length === 0 && (
            <p className="text-sm text-neutral-500">
              Todavía no hay nadie en el reparto.
            </p>
          )}
        </div>
      </div>

      {/* ------------------------------------------------- Lugar y fecha */}
      <div className="card p-6">
        <h2 className="font-semibold">Dónde y cuándo se firma</h2>
        <form action={saveAgreementMeta.bind(null, song.id)} className="grid sm:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="label" htmlFor="agreementPlace">Lugar</label>
            <input
              id="agreementPlace"
              name="agreementPlace"
              defaultValue={song.agreementPlace ?? ""}
              placeholder="Madrid"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="agreementDate">Fecha</label>
            <input
              id="agreementDate"
              name="agreementDate"
              type="date"
              defaultValue={song.agreementDate ? song.agreementDate.toISOString().slice(0, 10) : ""}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="isrc">ISRC (opcional)</label>
            <input
              id="isrc"
              name="isrc"
              defaultValue={song.isrc ?? ""}
              placeholder="ESXXX2600001"
              className="input"
            />
          </div>
          <div className="sm:col-span-3">
            <SubmitButton className="btn btn-secondary" pendingLabel="Guardando…">
              Guardar
            </SubmitButton>
          </div>
        </form>
      </div>

      <p className="text-xs text-neutral-600 leading-relaxed">
        Este documento recoge lo que acordáis entre vosotros y sirve como prueba
        de ese acuerdo. No sustituye el asesoramiento de un abogado ni el alta
        de la obra en tu entidad de gestión: si hay dinero serio de por medio o
        alguien tiene contrato de edición, que lo revise un profesional antes de
        firmarlo.
      </p>
    </div>
  );
}
