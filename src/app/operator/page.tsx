import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { prisma } from "@/lib/db";
import { priceLabel } from "@/lib/utils";
import {
  Eye,
  MessageCircle,
  CalendarCheck,
  Wallet,
  ListTree,
  Inbox,
  Plus,
  TrendingUp,
} from "lucide-react";

export default async function OperatorHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "OPERATOR" && session.user.role !== "ADMIN") {
    redirect("/explore");
  }

  const operator = await prisma.operatorProfile.findUnique({
    where: { userId: session.user.id },
    include: { listings: true },
  });
  if (!operator) redirect("/explore");

  const listingIds = operator.listings.map((l) => l.id);
  const [views, bookings, enquiries, activeListings] = await Promise.all([
    prisma.listingView.count({ where: { listingId: { in: listingIds } } }),
    prisma.booking.findMany({
      where: { listingId: { in: listingIds } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { listing: true, traveler: true },
    }),
    prisma.booking.count({
      where: { listingId: { in: listingIds }, status: "REQUESTED" },
    }),
    operator.listings.filter((l) => l.status === "ACTIVE").length,
  ]);

  const revenue = await prisma.booking.aggregate({
    where: {
      listingId: { in: listingIds },
      status: { in: ["CONFIRMED", "PAID"] },
    },
    _sum: { totalPrice: true },
  });

  const stats = [
    { label: "Views", value: String(views), icon: Eye, hint: "All time" },
    { label: "Requests", value: String(enquiries), icon: MessageCircle, hint: "Need reply" },
    { label: "Live", value: String(activeListings), icon: ListTree, hint: "Active now" },
    {
      label: "Revenue",
      value: priceLabel(revenue._sum.totalPrice || 0),
      icon: Wallet,
      hint: "Confirmed",
    },
  ];

  return (
    <Providers>
      <AppShell role="OPERATOR">
        <div className="flex flex-col gap-5 sm:gap-6 lg:gap-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zim-red">
              Operator
            </p>
            <h1 className="mt-1 text-[1.65rem] font-bold leading-tight tracking-tight sm:text-3xl">
              {operator.businessName}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Listings, availability, and booking requests in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <Link
              href="/operator/listings"
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-zim-black px-3 py-3.5 text-sm font-semibold text-white sm:rounded-full sm:px-4 sm:py-2.5"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Listings
            </Link>
            <Link
              href="/operator/insights"
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white px-3 py-3.5 text-sm font-semibold ring-1 ring-black/10 sm:rounded-full sm:px-4 sm:py-2.5"
            >
              <TrendingUp className="h-4 w-4 shrink-0" />
              Insights
            </Link>
          </div>

          {enquiries > 0 && (
            <Link
              href="/operator/bookings"
              className="flex items-center justify-between gap-3 rounded-2xl bg-zim-red/[0.08] px-4 py-3 text-sm font-semibold text-zim-red"
            >
              <span className="inline-flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                {enquiries} open booking request{enquiries === 1 ? "" : "s"}
              </span>
              <span aria-hidden>→</span>
            </Link>
          )}

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-[1.15rem] bg-white p-3.5 ring-1 ring-black/[0.06] sm:rounded-[1.25rem] sm:p-5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zim-green/10 sm:h-9 sm:w-9">
                    <Icon className="h-3.5 w-3.5 text-zim-green sm:h-4 sm:w-4" />
                  </div>
                  <p className="mt-2.5 text-lg font-bold tracking-tight sm:mt-3 sm:text-2xl">
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold">{s.label}</p>
                  <p className="text-[11px] text-muted">{s.hint}</p>
                </div>
              );
            })}
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold sm:text-lg">Latest requests</h2>
              <Link href="/operator/bookings" className="text-sm font-semibold text-zim-red">
                See all
              </Link>
            </div>
            <div className="space-y-2.5">
              {bookings.length === 0 && (
                <div className="rounded-[1.25rem] bg-white px-5 py-8 text-center ring-1 ring-black/[0.06]">
                  <CalendarCheck className="mx-auto h-6 w-6 text-muted" />
                  <p className="mt-2 text-sm text-muted">No booking requests yet.</p>
                </div>
              )}
              {bookings.map((b) => {
                const pending = b.status === "REQUESTED";
                const confirmed = b.status === "CONFIRMED" || b.status === "PAID";
                return (
                  <Link
                    key={b.id}
                    href="/operator/bookings"
                    className="block rounded-[1.15rem] bg-white p-3.5 ring-1 ring-black/[0.06] transition active:scale-[0.99] sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold leading-snug">{b.listing.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {b.traveler.name || b.traveler.email}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {b.guests} guests · {format(b.startDate, "d MMM")} –{" "}
                          {format(b.endDate, "d MMM")}
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
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </AppShell>
    </Providers>
  );
}
