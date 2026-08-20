import { Mail } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 h-12 w-12 rounded-xl bg-indigo-500/15 flex items-center justify-center">
          <Mail className="text-indigo-300" size={22} />
        </div>
        <h1 className="text-xl font-semibold mb-2">Revisa tu correo</h1>
        <p className="text-sm text-neutral-400">
          Te hemos enviado un enlace de acceso. Ábrelo desde este mismo dispositivo para
          entrar en Music Manager.
        </p>
      </div>
    </div>
  );
}
