import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { prisma } from "@/lib/db";
import { AvailabilityForm } from "@/components/AvailabilityForm";

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const operator = await prisma.operatorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!operator) redirect("/explore");

  const listing = await prisma.listing.findFirst({
    where: { id, operatorId: operator.id },
    include: {
      availability: { orderBy: { date: "asc" }, take: 60 },
    },
  });
  if (!listing) notFound();

  return (
    <Providers>
      <AppShell role="OPERATOR">
        <div className="flex flex-col gap-5 sm:gap-6 lg:gap-8">
          <div>
            <Link
              href="/operator/listings"
              className="inline-flex text-sm font-semibold text-zim-red"
            >
              ← Listings
            </Link>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zim-red">
              Availability
            </p>
            <h1 className="mt-1 text-[1.65rem] font-bold leading-tight tracking-tight sm:text-3xl">
              {listing.title}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Set open dates and remaining capacity travelers can request.
            </p>
          </div>

          <div className="grid gap-5 sm:gap-6 lg:grid-cols-5 lg:gap-8">
            <div className="lg:col-span-2">
              <AvailabilityForm listingId={listing.id} capacity={listing.capacity} />
            </div>
            <div className="space-y-2 lg:col-span-3">
              <div className="mb-1 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold sm:text-lg">Upcoming dates</h2>
                <span className="text-xs text-muted">{listing.availability.length} set</span>
              </div>
              {listing.availability.length === 0 && (
                <div className="rounded-[1.25rem] bg-white px-5 py-8 text-center ring-1 ring-black/[0.06]">
                  <p className="text-sm text-muted">No dates set yet.</p>
                </div>
              )}
              {listing.availability.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-[1.15rem] bg-white px-4 py-3.5 text-sm ring-1 ring-black/[0.06]"
                >
                  <span className="font-medium">{format(a.date, "EEE d MMM yyyy")}</span>
                  <span className="shrink-0 text-muted">
                    {a.capacityRemaining} left
                    {a.priceOverride != null ? ` · $${a.priceOverride}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    </Providers>
  );
}
