import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { prisma } from "@/lib/db";
import { priceLabel } from "@/lib/utils";
import { photoForPlace } from "@/lib/destinations";

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { travelerId: session.user.id },
    include: {
      listing: { select: { title: true, photos: true, city: true, region: true, price: true, currency: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Providers>
      <AppShell role={session.user.role}>
        <div className="mx-auto w-full max-w-3xl lg:max-w-none">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zim-red">Bookings</p>
          <h1 className="mt-1 text-[1.7rem] font-bold leading-tight tracking-tight sm:text-3xl">Your requests</h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted">Stays and activities you have asked operators to confirm.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.length === 0 && (
              <div className="rounded-[1.25rem] bg-white px-5 py-8 text-center ring-1 ring-black/[0.06] sm:col-span-2 lg:col-span-3">
                <p className="text-sm text-muted">No bookings yet.</p>
                <Link href="/explore" className="mt-2 inline-block text-sm font-semibold text-zim-red">
                  Find a place
                </Link>
              </div>
            )}
            {bookings.map((b) => {
              const photo =
                photoForPlace(b.listing.city, b.listing.region) ||
                b.listing.photos[0] ||
                "/photos/victoria-falls.jpg";
              const confirmed = b.status === "CONFIRMED" || b.status === "PAID";
              return (
                <Link
                  key={b.id}
                  href={`/listings/${b.listingId}`}
                  className="flex items-center gap-3 rounded-[1.15rem] bg-white p-3 ring-1 ring-black/[0.06] transition hover:ring-zim-green/25 lg:p-4"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <Image src={photo} alt="" fill unoptimized className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{b.listing.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {format(b.startDate, "d MMM")} – {format(b.endDate, "d MMM")} · {b.guests} guests
                    </p>
                    <p className="mt-1 text-xs font-semibold text-zim-green">
                      {b.totalPrice > 0 ? priceLabel(b.totalPrice, b.currency) : "Price on request"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
                      confirmed ? "bg-zim-green/10 text-zim-green" : "bg-zim-red/10 text-zim-red"
                    }`}
                  >
                    {confirmed ? "Confirmed" : b.status.toLowerCase()}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </AppShell>
    </Providers>
  );
}
