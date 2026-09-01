import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { setUserName } from "@/lib/actions/onboarding";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.name) redirect("/");

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

        <h1 className="poster text-3xl sm:text-4xl text-white text-center leading-none mb-3">
          BIENVENIDO
        </h1>
        <p className="text-sm text-white/50 text-center mb-10 max-w-[28ch]">
          Antes de entrar, dinos cómo quieres que te llamemos por aquí.
        </p>

        <div
          className="w-full rounded-2xl p-6 backdrop-blur-xl"
          style={{
            background: "rgba(20, 18, 26, 0.55)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px -20px rgba(0,0,0,0.6)",
          }}
        >
          <form action={setUserName} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">
                Tu nombre
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoFocus
                maxLength={60}
                placeholder="Como quieras que te llamemos"
                className="input"
                style={{ background: "rgba(0,0,0,0.35)", borderColor: "rgba(255,255,255,0.12)" }}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full justify-center py-2.5">
              Entrar en Music Manager
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
