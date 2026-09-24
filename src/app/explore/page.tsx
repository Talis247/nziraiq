import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { ListingCard } from "@/components/ListingCard";
import { prisma } from "@/lib/db";
import { Providers } from "@/components/Providers";
import { destinations, fastPhoto, photoForPlace } from "@/lib/destinations";
import { findCluster, spotWhere } from "@/lib/clusters";
import { Search } from "lucide-react";
import Link from "next/link";

const types = [
  { value: "STAY", label: "Stays" },
  { value: "ACTIVITY", label: "Activities" },
  { value: "GUIDE", label: "Guides" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "EXPERIENCE", label: "Experiences" },
] as const;

function exploreHref(opts: { region?: string; type?: string; q?: string }) {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.region) params.set("region", opts.region);
  if (opts.type) params.set("type", opts.type);
  const query = params.toString();
  return query ? `/explore?${query}` : "/explore";
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; type?: string; q?: string; spot?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const region = params.region?.trim() || "";
  const type = params.type?.trim() || "";
  const q = params.q?.trim() || "";

  const cluster = findCluster(region);
  const textFilter = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { city: { contains: q, mode: "insensitive" as const } },
          { included: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const typeFilter = type ? { type: type as (typeof types)[number]["value"] } : {};

  const focus = (params.spot || region).trim().toLowerCase();
  const orderedSpots = cluster
    ? [...cluster.spots]        .sort((a, b) => {
        const hit = (spot: { name: string; terms: string[] }) =>
          spot.name.toLowerCase() === focus || spot.terms.some((t) => t === focus);
        if (hit(a)) return -1;
        if (hit(b)) return 1;
        return 0;
      })
    : [];

  const sections = cluster
    ? await Promise.all(
        orderedSpots.map(async (spot) => ({
          spot,
          listings: await prisma.listing.findMany({
            where: {
              status: "ACTIVE",
              AND: [spotWhere(cluster, spot), textFilter, typeFilter],
            },
            orderBy: [{ title: "asc" }],
            take: 4,
          }),
        })),
      )
    : null;

  const showPlaces = !cluster && !region && !q && !type;

  const where = {
    status: "ACTIVE" as const,
    AND: [
      region
        ? {
            OR: [
              { city: { contains: region, mode: "insensitive" as const } },
              { region: { contains: region, mode: "insensitive" as const } },
            ],
          }
        : {},
      textFilter,
      typeFilter,
    ],
  };

  const [listings, total] = cluster || showPlaces
    ? [[], 0]
    : await Promise.all([
        prisma.listing.findMany({
          where,
          orderBy: [{ city: "asc" }, { title: "asc" }],
          take: 24,
        }),
        prisma.listing.count({ where }),
      ]);

  const place = destinations.find(
    (d) =>
      d.regionQuery.toLowerCase() === region.toLowerCase() ||
      d.name.toLowerCase() === region.toLowerCase(),
  );
  const heading = place?.name || region || "Explore Zimbabwe";

  return (
    <Providers>
      <AppShell role={session?.user?.role ?? "TRAVELER"}>
        <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zim-red">Explore</p>
            <h1 className="mt-1 text-[1.7rem] font-bold leading-tight tracking-tight">{heading}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {cluster?.aroundLabel || place?.blurb || "Stays, guides, and experiences across Zimbabwe."}
            </p>
          </div>

          <form action="/explore" className="relative">
            {region && <input type="hidden" name="region" value={region} />}
            {type && <input type="hidden" name="type" value={type} />}
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search facilities in this view…"
              className="w-full rounded-full border border-border bg-white py-3 pl-11 pr-4 text-sm outline-none ring-zim-green focus:ring-2"
            />
          </form>

          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            <Link
              href={exploreHref({ q, type })}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold ${
                !region ? "bg-zim-black text-white" : "bg-black/[0.04] text-muted"
              }`}
            >
              All places
            </Link>
            {destinations.map((d) => {
              const active = region.toLowerCase() === d.regionQuery.toLowerCase();
              return (
                <Link
                  key={d.name}
                  href={exploreHref({ region: d.regionQuery, type, q })}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold ${
                    active ? "bg-zim-green text-white" : "bg-black/[0.04] text-foreground"
                  }`}
                >
                  {d.name}
                </Link>
              );
            })}
          </div>

          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            <Link
              href={exploreHref({ region, q })}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                !type ? "bg-zim-black text-white" : "text-muted"
              }`}
            >
              All types
            </Link>
            {types.map((t) => {
              const active = type === t.value;
              return (
                <Link
                  key={t.value}
                  href={exploreHref({ region, q, type: t.value })}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                    active ? "bg-zim-black text-white" : "text-muted"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>

          {!cluster && !showPlaces && (
            <p className="text-xs font-medium text-muted">
              {total === 0
                ? "No facilities match"
                : `Showing ${listings.length} of ${total} registered facilities`}
            </p>
          )}

          {showPlaces ? (
            <div className="grid grid-cols-2 gap-3">
              {destinations.map((d, index) => (
                <Link
                  key={d.name}
                  href={exploreHref({ region: d.regionQuery })}
                  className="overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-black/[0.06]"
                >
                  <div className="aspect-[5/4] overflow-hidden bg-black/[0.04]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fastPhoto(d.image)}
                      alt=""
                      loading={index < 4 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={index < 2 ? "high" : "low"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-[13px] font-semibold">{d.name}</p>
                    <p className="truncate text-xs text-muted">{d.place}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : sections ? (
            <div className="flex flex-col gap-7">
              {sections.map(({ spot, listings: spotListings }) => (
                <section key={spot.name} id={spot.name} className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-[15px] font-bold">{spot.name}</h2>
                    <span className="text-[11px] font-medium text-muted">
                      {spotListings.length === 0 ? "Soon" : `${spotListings.length} places`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 items-stretch gap-3">
                    {(() => {
                      const banner = spot.image || photoForPlace(spot.name);
                      if (!banner) return null;
                      return (
                        <div className="relative col-span-2 h-36 overflow-hidden rounded-[1.25rem] bg-black/[0.04]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={fastPhoto(banner)}
                            alt={spot.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      );
                    })()}
                    {spotListings.map((listing) => (
                      <ListingCard key={listing.id} {...listing} compact />
                    ))}
                    {spotListings.length === 0 && !spot.image && (
                      <p className="col-span-2 rounded-2xl border border-dashed border-border bg-white p-4 text-sm text-muted">
                        No registered {spot.name.toLowerCase()} in this area yet.
                      </p>
                    )}
                  </div>
                </section>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted">
              Nothing in this filter yet. Try another place or type.
            </div>
          ) : (
            <div className="grid grid-cols-2 items-stretch gap-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} {...listing} compact />
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </Providers>
  );
}
