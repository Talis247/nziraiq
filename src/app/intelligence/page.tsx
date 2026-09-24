import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getAdminAnalytics } from "@/lib/intelligence/admin-analytics";

export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STAKEHOLDER" && session.user.role !== "ADMIN") {
    redirect("/explore");
  }

  const data = await getAdminAnalytics();

  return (
    <Providers>
      <AppShell role={session.user.role === "ADMIN" ? "ADMIN" : "STAKEHOLDER"}>
        <AdminDashboard data={data} />
      </AppShell>
    </Providers>
  );
}
