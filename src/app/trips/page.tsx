import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { prisma } from "@/lib/db";
import { priceLabel } from "@/lib/utils";

export default async function TripsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const trips = await prisma.itinerary.findMany({
    where: { travelerId: session.user.id },
    include: { _count: { select: { stops: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Providers>
      <AppShell role={session.user.role}>
        <div className="mx-auto w-full max-w-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zim-red">Trips</p>
              <h1 className="mt-1 text-[1.7rem] font-bold leading-tight tracking-tight">Saved plans</h1>
            </div>
            <Link
              href="/copilot"
              className="shrink-0 rounded-full bg-zim-black px-4 py-2 text-sm font-semibold text-white"
            >
              New plan
            </Link>
          </div>
          <p className="mt-1.5 text-sm text-muted">Itineraries from Copilot, ready to adjust or book.</p>

          <div className="mt-6 space-y-3">
            {trips.length === 0 && (
              <div className="rounded-[1.25rem] bg-white px-5 py-8 text-center ring-1 ring-black/[0.06]">
                <p className="text-sm text-muted">No saved trips yet.</p>
                <Link href="/copilot" className="mt-2 inline-block text-sm font-semibold text-zim-red">
                  Plan one with Copilot
                </Link>
              </div>
            )}
            {trips.map((t) => (
              <Link
                key={t.id}
                href={`/trips/${t.id}`}
                className="block rounded-[1.15rem] bg-white p-4 ring-1 ring-black/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{t.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {t._count.stops} {t._count.stops === 1 ? "stop" : "stops"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-zim-green">
                    {t.totalEstimate && t.totalEstimate > 0
                      ? priceLabel(t.totalEstimate, t.currency)
                      : "On request"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </AppShell>
    </Providers>
  );
}
