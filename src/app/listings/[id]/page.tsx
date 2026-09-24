import { notFound } from "next/navigation";
import { after } from "next/server";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { prisma } from "@/lib/db";
import { fastPhoto, photoForPlace } from "@/lib/destinations";
import { priceLabel } from "@/lib/utils";
import { MapPin, Star, Users } from "lucide-react";
import { BookingRequestForm } from "@/components/BookingRequestForm";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { operator: true },
  });
  if (!listing) notFound();

  after(() => {
    void prisma.listingView.create({
      data: { listingId: listing.id, userId: session?.user?.id },
    });
  });

  const raw =
    listing.photos.find((p) => p.startsWith("/uploads/") || p.startsWith("/photos/")) ||
    listing.photos[0] ||
    photoForPlace(listing.city, listing.region) ||
    "/photos/safari-1.jpg";
  const photo = fastPhoto(raw);

  return (
    <Providers>
      <AppShell role={session?.user?.role ?? "TRAVELER"}>
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="relative aspect-[16/11] overflow-hidden rounded-3xl bg-black/[0.04]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={listing.title} className="h-full w-full object-cover" />
            </div>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-zim-gold">
                {listing.type.toLowerCase()}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">{listing.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {listing.region}
                  {listing.city ? `, ${listing.city}` : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-zim-gold" /> {listing.ratingAvg.toFixed(1)} (
                  {listing.ratingCount})
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> Up to {listing.capacity}
                </span>
              </div>
              <p className="mt-5 leading-relaxed text-foreground/90">{listing.description}</p>
              {listing.included && (
                <p className="mt-4 text-sm text-muted">
                  <span className="font-semibold text-foreground">Included: </span>
                  {listing.included}
                </p>
              )}
              <p className="mt-4 text-sm text-muted">
                Hosted by{" "}
                <span className="font-semibold text-foreground">
                  {listing.operator.businessName}
                </span>
              </p>
            </div>
          </div>

          <aside className="lg:col-span-2">
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <p className="text-2xl font-bold text-zim-green">
                {priceLabel(listing.price, listing.currency)}
                {listing.price > 0 && (
                  <span className="text-sm font-medium text-muted"> / person</span>
                )}
              </p>
              {listing.grade && (
                <p className="mt-1 text-sm text-muted">Grade: {listing.grade}</p>
              )}
              <p className="mt-1 text-xs text-muted">
                {listing.price > 0
                  ? "Prices and availability come from the operator — never invented."
                  : "This facility is on the national register. The operator confirms the rate when you request a booking."}
              </p>
              <BookingRequestForm
                listingId={listing.id}
                price={listing.price}
                currency={listing.currency}
                signedIn={!!session?.user}
              />
            </div>
          </aside>
        </div>
      </AppShell>
    </Providers>
  );
}
