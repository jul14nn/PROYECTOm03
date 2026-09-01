"use server";

import { signIn, signOut } from "@/lib/auth";

/**
 * Next señala el éxito de una redirección lanzando un error especial. Hay que
 * dejarlo pasar intacto: capturarlo como si fuera un fallo rompería el flujo.
 */
function esRedireccionDeNext(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function sendMagicLink(formData: FormData) {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) return;

  try {
    await signIn("nodemailer", { email: email.trim(), redirectTo: "/" });
  } catch (err) {
    if (esRedireccionDeNext(err)) throw err;
    // Auth.js se guarda los fallos que no son suyos y solo redirige a la
    // página de error, así que sin esto el motivo real no aparece en ningún
    // sitio: ni en sus logs ni en los nuestros.
    console.error("[music-manager] Falló el envío del enlace de acceso:", err);
    throw err;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
