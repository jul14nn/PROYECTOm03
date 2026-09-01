import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TopNav from "@/components/TopNav";
import { THEMES, isTheme } from "@/lib/themes";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.name) redirect("/onboarding");

  const kit = await prisma.brandKit.findUnique({
    where: { userId: session.user.id },
    select: { theme: true },
  });

  // El tema se resuelve en el servidor: si se aplicara desde el cliente,
  // la primera pintura saldría con el tema por defecto y parpadearía.
  const theme = isTheme(kit?.theme) ? kit.theme : THEMES[0].id;

  return (
    <div className="skin min-h-full" data-skin={theme}>
      <TopNav userName={session.user.name} userEmail={session.user.email} />
      <main className="min-w-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
