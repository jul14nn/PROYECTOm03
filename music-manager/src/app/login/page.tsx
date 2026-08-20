import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { sendMagicLink } from "@/lib/actions/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-indigo-500 flex items-center justify-center font-bold text-xl">
            M
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">Music Manager</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Gestión de producción musical, de la idea al lanzamiento.
            </p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold mb-1">Inicia sesión</h2>
          <p className="text-sm text-neutral-400 mb-5">
            Te enviamos un enlace de acceso a tu email — sin contraseñas.
          </p>
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
              />
            </div>
            <button type="submit" className="btn btn-primary w-full justify-center">
              Enviar enlace de acceso
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
