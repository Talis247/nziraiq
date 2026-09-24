import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { FeaturedPlace } from "@/components/FeaturedPlace";
import { Providers } from "@/components/Providers";
import { prisma } from "@/lib/db";
import { destinations } from "@/lib/destinations";
import { format } from "date-fns";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "OPERATOR") redirect("/operator");
  if (session.user.role === "STAKEHOLDER" || session.user.role === "ADMIN") {
    redirect("/intelligence");
  }
  const [trips, bookings] = await Promise.all([
    prisma.itinerary.findMany({
      where: { travelerId: session.user.id },
      include: { _count: { select: { stops: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.booking.findMany({
      where: {
        travelerId: session.user.id,
        status: { in: ["REQUESTED", "CONFIRMED", "PAID"] },
      },
      include: { listing: true },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
  ]);

  const firstName = session.user.name?.split(" ")[0] || "Explorer";
  const initial = firstName.charAt(0).toUpperCase();
  const featured = destinations[0];

  return (
    <Providers>
      <AppShell role="TRAVELER">
        <div className="w-full">
          <div className="flex items-start justify-between gap-3 lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm text-muted">
                Hi, {firstName} <span aria-hidden>👋</span>
              </p>
              <h1 className="mt-1 text-[1.7rem] font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                Where do you want to go?
              </h1>
            </div>
            <Link
              href="/profile"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zim-green text-sm font-bold text-white ring-2 ring-zim-red/70 ring-offset-2 md:hidden"
              aria-label="Profile"
            >
              {initial}
            </Link>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-6 lg:max-w-2xl">
            <form action="/explore" className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                name="q"
                placeholder="Search destinations, stays, guides…"
                className="w-full rounded-full border border-border bg-white py-3.5 pl-11 pr-4 text-sm outline-none ring-zim-green focus:ring-2"
              />
            </form>
            <Link
              href="/copilot"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-zim-black px-4 py-3.5 text-sm font-semibold text-white sm:py-3"
            >
              <Sparkles className="h-4 w-4" />
              Plan with Copilot
            </Link>
          </div>

          <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-5 lg:gap-10">
            <div className="lg:col-span-3">
              <FeaturedPlace places={destinations} />

              <div className="mt-8 flex items-center justify-between">
                <h2 className="text-lg font-bold">Popular destinations</h2>
                <Link href="/explore" className="text-sm font-semibold text-zim-red">
                  See all
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                {destinations.slice(1).map((d) => (
                  <Link
                    key={d.name}
                    href={`/explore?region=${encodeURIComponent(d.regionQuery)}`}
                    className="min-w-0"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.15rem] bg-black/[0.04] sm:aspect-[5/4]">
                      <Image
                        src={d.image}
                        alt=""
                        fill
                        unoptimized
                        className="rounded-[1.15rem] object-cover"
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 180px"
                      />
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold">{d.name}</p>
                    <p className="truncate text-xs text-muted">{d.place}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Upcoming trips</h2>
                <Link href="/trips" className="text-sm font-semibold text-zim-red">
                  See all
                </Link>
              </div>

              <div className="mt-3 space-y-3">
                {bookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/listings/${b.listingId}`}
                    className="flex items-center gap-3 rounded-[1.15rem] bg-white p-3 ring-1 ring-black/[0.06] transition hover:ring-zim-green/30 lg:p-4"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-[4.5rem] sm:w-[4.5rem]">
                      <Image
                        src={
                          b.listing.photos[0] ||
                          "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Lake_Kariba.jpg/1280px-Lake_Kariba.jpg"
                        }
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="72px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{b.listing.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {format(b.startDate, "d MMM")} – {format(b.endDate, "d MMM yyyy")}
                      </p>
                      <p className="text-xs text-muted">{b.guests} guests</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        b.status === "CONFIRMED" || b.status === "PAID"
                          ? "bg-zim-green/10 text-zim-green"
                          : "bg-zim-red/10 text-zim-red"
                      }`}
                    >
                      {b.status === "PAID" ? "Confirmed" : b.status.toLowerCase()}
                    </span>
                  </Link>
                ))}

                {bookings.length === 0 &&
                  trips.map((t) => (
                    <Link
                      key={t.id}
                      href={`/trips/${t.id}`}
                      className="flex items-center gap-3 rounded-[1.15rem] bg-white p-3 ring-1 ring-black/[0.06] transition hover:ring-zim-green/30 lg:p-4"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={featured.image}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{t.title}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {t._count.stops} {t._count.stops === 1 ? "stop" : "stops"} saved
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-zim-red/10 px-2.5 py-1 text-[10px] font-bold uppercase text-zim-red">
                        Draft
                      </span>
                    </Link>
                  ))}

                {bookings.length === 0 && trips.length === 0 && (
                  <div className="rounded-[1.25rem] bg-white px-5 py-8 text-center ring-1 ring-black/[0.06]">
                    <p className="text-sm text-muted">No trips yet.</p>
                    <Link
                      href="/copilot"
                      className="mt-2 inline-block text-sm font-semibold text-zim-red"
                    >
                      Plan one with Copilot
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </Providers>
  );
}
