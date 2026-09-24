import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { prisma } from "@/lib/db";
import { priceLabel } from "@/lib/utils";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const trip = await prisma.itinerary.findFirst({
    where: { id, travelerId: session.user.id },
    include: { stops: { orderBy: [{ dayIndex: "asc" }, { order: "asc" }] } },
  });
  if (!trip) notFound();

  const days = Array.from(new Set(trip.stops.map((s) => s.dayIndex)));

  return (
    <Providers>
      <AppShell role={session.user.role}>
        <div className="mx-auto w-full max-w-xl lg:max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zim-red">Trip</p>
          <h1 className="mt-1 text-[1.7rem] font-bold leading-tight tracking-tight">{trip.title}</h1>
          <p className="mt-1.5 text-sm font-semibold text-zim-green">
            {trip.totalEstimate && trip.totalEstimate > 0
              ? priceLabel(trip.totalEstimate, trip.currency)
              : "Prices on request"}
          </p>

          <div className="mt-7 flex flex-col gap-7">
            {days.map((day) => (
              <section key={day}>
                <h2 className="mb-3 text-[15px] font-bold">Day {day}</h2>
                <div className="space-y-2.5">
                  {trip.stops
                    .filter((s) => s.dayIndex === day)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="rounded-[1.15rem] bg-white p-4 ring-1 ring-black/[0.06]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold">{s.placeName}</p>
                            {s.timing && <p className="mt-0.5 text-xs text-muted">{s.timing}</p>}
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-zim-green">
                            {s.estimatedCost && s.estimatedCost > 0
                              ? priceLabel(s.estimatedCost, trip.currency)
                              : "On request"}
                          </p>
                        </div>
                        {s.reason && <p className="mt-2 text-sm leading-relaxed text-muted">{s.reason}</p>}
                        {s.listingId && (
                          <Link
                            href={`/listings/${s.listingId}`}
                            className="mt-3 inline-block text-sm font-semibold text-zim-red"
                          >
                            View and book
                          </Link>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </AppShell>
    </Providers>
  );
}
