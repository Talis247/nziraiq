import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { OperatorAnalyticsView } from "@/components/operator/OperatorAnalyticsView";
import { getOperatorAnalytics } from "@/lib/intelligence/operator-analytics";

export const dynamic = "force-dynamic";

export default async function OperatorInsightsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "OPERATOR" && session.user.role !== "ADMIN") {
    redirect("/explore");
  }

  const data = await getOperatorAnalytics(session.user.id);
  if (!data) redirect("/explore");

  return (
    <Providers>
      <AppShell role="OPERATOR">
        <OperatorAnalyticsView data={data} />
      </AppShell>
    </Providers>
  );
}
