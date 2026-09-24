import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { prisma } from "@/lib/db";
import { OperatorListingsView } from "@/components/operator/OperatorListingsView";

export default async function OperatorListingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "OPERATOR" && session.user.role !== "ADMIN") {
    redirect("/explore");
  }

  const operator = await prisma.operatorProfile.findUnique({
    where: { userId: session.user.id },
    include: { listings: { orderBy: { createdAt: "desc" } } },
  });
  if (!operator) redirect("/explore");

  return (
    <Providers>
      <AppShell role="OPERATOR">
        <OperatorListingsView
          operatorType={operator.type}
          businessName={operator.businessName}
          listings={operator.listings.map((l) => ({
            id: l.id,
            title: l.title,
            type: l.type,
            region: l.region,
            city: l.city,
            status: l.status,
            price: l.price,
            currency: l.currency,
            photos: l.photos,
          }))}
        />
      </AppShell>
    </Providers>
  );
}
