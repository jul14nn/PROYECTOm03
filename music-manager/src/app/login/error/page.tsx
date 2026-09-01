import Link from "next/link";

/**
 * Página de error de Auth.js, en nuestro idioma y con nuestra cara.
 *
 * Su página por defecto dice "There is a problem with the server
 * configuration" para casi cualquier fallo, porque solo considera seguros de
 * mostrar un puñado de tipos de error y el resto los agrupa como
 * "Configuration". Traducirlo aquí es la única forma de decirle a alguien
 * qué ha pasado de verdad.
 */

const MENSAJES: Record<string, { titulo: string; detalle: string }> = {
  Configuration: {
    titulo: "No hemos podido enviar el correo",
    detalle:
      "El servidor de correo ha rechazado el envío o no está bien configurado. Si administras esta app, mira los registros del despliegue: el motivo exacto aparece ahí.",
  },
  Verification: {
    titulo: "Ese enlace ya no vale",
    detalle:
      "Los enlaces de acceso caducan y solo se pueden usar una vez. Pide uno nuevo y ábrelo en este mismo navegador.",
  },
  AccessDenied: {
    titulo: "Acceso denegado",
    detalle: "Esta cuenta no tiene permiso para entrar.",
  },
};

const POR_DEFECTO = {
  titulo: "Algo ha fallado al entrar",
  detalle: "Vuelve a intentarlo. Si sigue pasando, revisa los registros del despliegue.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { titulo, detalle } = (error && MENSAJES[error]) || POR_DEFECTO;

  return (
    <div className="stage-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center poster text-2xl text-white mb-6"
          style={{
            background: "linear-gradient(135deg, var(--accent-violet), var(--accent-magenta))",
            boxShadow: "0 12px 32px -8px color-mix(in srgb, var(--accent-magenta) 60%, transparent)",
          }}
        >
          KR
        </div>

        <div
          className="w-full rounded-2xl p-6 backdrop-blur-xl"
          style={{
            background: "rgba(20, 18, 26, 0.55)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px -20px rgba(0,0,0,0.6)",
          }}
        >
          <h1 className="font-semibold text-white mb-2">{titulo}</h1>
          <p className="text-sm text-white/60 mb-5">{detalle}</p>

          <Link href="/login" className="btn btn-primary w-full justify-center">
            Volver a intentarlo
          </Link>

          {error && (
            <p className="text-[0.7rem] text-white/25 mt-4 text-center">
              Código: {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
