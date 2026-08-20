import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import { MobileTopBar, MobileTabBar } from "@/components/MobileNav";
import { THEMES, isTheme } from "@/lib/themes";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.name) redirect("/onboarding");

  const kit = await prisma.brandKit.findUnique({
    where: { userId: session.user.id },
    select: { theme: true, sidebarMode: true },
  });

  // El tema se resuelve en el servidor: si se aplicara desde el cliente,
  // la primera pintura saldría con el tema por defecto y parpadearía.
  const theme = isTheme(kit?.theme) ? kit.theme : THEMES[0].id;
  const rail = kit?.sidebarMode === "rail";

  return (
    <div className="skin min-h-full flex" data-skin={theme}>
      <Sidebar
        userName={session.user.name}
        userEmail={session.user.email}
        rail={rail}
      />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <MobileTopBar />
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
            {children}
          </div>
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
