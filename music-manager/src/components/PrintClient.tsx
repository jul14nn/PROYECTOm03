"use client";

import { Printer } from "lucide-react";

/** Imprimir es cosa del navegador, así que este botón vive en el cliente. */
export default function PrintClient() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary">
      <Printer size={15} /> Imprimir o guardar en PDF
    </button>
  );
}
