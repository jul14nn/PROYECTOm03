import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { MobileTopBar, MobileTabBar } from "@/components/MobileNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-full flex">
      <Sidebar userEmail={session.user.email} />
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
