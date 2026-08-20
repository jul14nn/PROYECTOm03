import { Mail } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="stage-bg min-h-screen flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm text-center rounded-2xl p-8 backdrop-blur-xl"
        style={{
          background: "rgba(20, 18, 26, 0.55)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px -20px rgba(0,0,0,0.6)",
        }}
      >
        <div
          className="mx-auto mb-5 h-12 w-12 rounded-xl flex items-center justify-center"
          style={{ background: "color-mix(in srgb, var(--accent-magenta) 20%, transparent)" }}
        >
          <Mail className="text-white/90" size={22} />
        </div>
        <h1 className="poster text-2xl text-white mb-2">REVISA TU CORREO</h1>
        <p className="text-sm text-white/50">
          Te hemos enviado un enlace de acceso. Ábrelo desde este mismo dispositivo para
          entrar en Music Manager.
        </p>
      </div>
    </div>
  );
}
