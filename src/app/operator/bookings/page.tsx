import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { prisma } from "@/lib/db";
import { priceLabel } from "@/lib/utils";
import { OperatorBookingActions } from "@/components/OperatorBookingActions";

export default async function OperatorBookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "OPERATOR" && session.user.role !== "ADMIN") {
    redirect("/explore");
  }

  const operator = await prisma.operatorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!operator) redirect("/explore");

  const bookings = await prisma.booking.findMany({
    where: { listing: { operatorId: operator.id } },
    include: { listing: true, traveler: true },
    orderBy: { createdAt: "desc" },
  });

  const openCount = bookings.filter((b) => b.status === "REQUESTED").length;

  return (
    <Providers>
      <AppShell role="OPERATOR">
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zim-red">
                Bookings
              </p>
              <h1 className="mt-1 text-[1.65rem] font-bold leading-tight tracking-tight sm:text-3xl">
                Booking inbox
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Confirm or decline traveler requests for your listings.
              </p>
            </div>
            {openCount > 0 && (
              <span className="w-fit rounded-full bg-zim-red/10 px-3 py-1.5 text-xs font-semibold text-zim-red">
                {openCount} awaiting reply
              </span>
            )}
          </div>

          <div className="space-y-3">
            {bookings.length === 0 && (
              <div className="rounded-[1.25rem] bg-white px-5 py-10 text-center ring-1 ring-black/[0.06]">
                <p className="text-sm text-muted">No booking requests yet.</p>
              </div>
            )}

            {bookings.map((b) => {
              const pending = b.status === "REQUESTED";
              const confirmed = b.status === "CONFIRMED" || b.status === "PAID";
              return (
                <article
                  key={b.id}
                  className="overflow-hidden rounded-[1.15rem] bg-white ring-1 ring-black/[0.06]"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug">{b.listing.title}</p>
                        <p className="mt-1.5 text-sm text-muted">
                          {b.traveler.name || b.traveler.email}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {b.guests} guests · {format(b.startDate, "d MMM yyyy")} –{" "}
                          {format(b.endDate, "d MMM yyyy")}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
                            confirmed
                              ? "bg-zim-green/10 text-zim-green"
                              : pending
                                ? "bg-zim-red/10 text-zim-red"
                                : "bg-black/5 text-muted"
                          }`}
                        >
                          {b.status.toLowerCase()}
                        </span>
                        <p className="text-sm font-semibold text-zim-green">
                          {b.totalPrice > 0
                            ? priceLabel(b.totalPrice, b.currency)
                            : "On request"}
                        </p>
                      </div>
                    </div>
                    {b.notes && (
                      <p className="mt-3 rounded-2xl bg-black/[0.03] px-3 py-2.5 text-sm leading-relaxed">
                        {b.notes}
                      </p>
                    )}
                    {pending && <OperatorBookingActions bookingId={b.id} />}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </AppShell>
    </Providers>
  );
}
