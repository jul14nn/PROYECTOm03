import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { sendMagicLink } from "@/lib/actions/auth";
import { isEmailConfigured } from "@/lib/email/mailer";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

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

        <h1 className="poster text-4xl sm:text-5xl text-white text-center leading-none mb-3">
          MUSIC MANAGER
        </h1>
        <p className="text-sm text-white/50 text-center mb-10 max-w-[26ch]">
          De la idea al lanzamiento. Un mismo sitio para tu catálogo, tu agenda y tu equipo.
        </p>

        <div
          className="w-full rounded-2xl p-6 backdrop-blur-xl"
          style={{
            background: "rgba(20, 18, 26, 0.55)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px -20px rgba(0,0,0,0.6)",
          }}
        >
          <h2 className="font-semibold text-white mb-1">Inicia sesión</h2>
          <p className="text-sm text-white/50 mb-5">
            Te enviamos un enlace de acceso a tu email — sin contraseñas.
          </p>

          {/* Sin SMTP el enlace no puede salir. Decirlo aquí, antes de que
              alguien escriba su email y se quede esperando un correo que
              nunca va a llegar. En local no aplica: sale por consola. */}
          {process.env.NODE_ENV === "production" && !isEmailConfigured() && (
            <p
              className="text-sm mb-5 rounded-xl p-3"
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                color: "#fcd34d",
              }}
            >
              El envío de correo no está configurado en este despliegue, así
              que el enlace no llegaría. Faltan las variables SMTP_HOST,
              SMTP_USER y SMTP_PASS.
            </p>
          )}
          <form action={sendMagicLink} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                placeholder="tu@email.com"
                className="input"
                style={{ background: "rgba(0,0,0,0.35)", borderColor: "rgba(255,255,255,0.12)" }}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full justify-center py-2.5">
              Enviar enlace de acceso
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
