import { redirect } from "next/navigation";

/**
 * La agenda vive ahora en la raíz: es lo primero que se quiere ver al abrir
 * la app. Esta ruta se queda como redirección porque hay enlaces guardados
 * y correos antiguos que apuntan aquí, y /calendar/new y /calendar/[id]
 * siguen colgando de ella.
 */
export default function CalendarRedirect() {
  redirect("/");
}
