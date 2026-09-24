import { prisma } from "@/lib/db";

export async function aggregateInsights(period = "last_30_days") {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [searches, listings, bookings] = await Promise.all([
    prisma.searchEvent.groupBy({
      by: ["region"],
      where: { createdAt: { gte: since }, region: { not: null } },
      _count: { _all: true },
    }),
    prisma.listing.groupBy({
      by: ["region", "type"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
      _sum: { capacity: true },
    }),
    prisma.booking.groupBy({
      by: ["listingId"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { totalPrice: true },
    }),
  ]);

  const listingMeta = await prisma.listing.findMany({
    where: { id: { in: bookings.map((b) => b.listingId) } },
    select: { id: true, region: true, type: true },
  });
  const listingMap = Object.fromEntries(listingMeta.map((l) => [l.id, l]));

  const demandByRegion: Record<string, number> = {};
  for (const s of searches) {
    if (!s.region) continue;
    demandByRegion[s.region] = (demandByRegion[s.region] || 0) + s._count._all;
  }

  const supplyByRegion: Record<string, { listings: number; capacity: number }> = {};
  for (const l of listings) {
    const cur = supplyByRegion[l.region] || { listings: 0, capacity: 0 };
    cur.listings += l._count._all;
    cur.capacity += l._sum.capacity || 0;
    supplyByRegion[l.region] = cur;
  }

  const regions = Array.from(
    new Set([...Object.keys(demandByRegion), ...Object.keys(supplyByRegion)]),
  );

  const gaps = regions.map((region) => {
    const demand = demandByRegion[region] || 0;
    const supply = supplyByRegion[region]?.listings || 0;
    const score = demand - supply * 2;
    return {
      region,
      demand,
      supply,
      capacity: supplyByRegion[region]?.capacity || 0,
      gapScore: score,
      opportunity: score > 3,
    };
  });

  gaps.sort((a, b) => b.gapScore - a.gapScore);

  const bookingByRegion: Record<string, { count: number; revenue: number }> = {};
  for (const b of bookings) {
    const meta = listingMap[b.listingId];
    if (!meta) continue;
    const cur = bookingByRegion[meta.region] || { count: 0, revenue: 0 };
    cur.count += b._count._all;
    cur.revenue += b._sum.totalPrice || 0;
    bookingByRegion[meta.region] = cur;
  }

  await prisma.insight.deleteMany({
    where: { period, metricType: { in: ["DEMAND_SUPPLY_GAP", "TREND", "ALERT"] } },
  });

  await prisma.insight.createMany({
    data: [
      {
        region: "ALL",
        period,
        metricType: "DEMAND_SUPPLY_GAP",
        payload: { gaps },
      },
      {
        region: "ALL",
        period,
        metricType: "TREND",
        payload: { bookingByRegion, demandByRegion },
      },
      ...gaps
        .filter((g) => g.opportunity)
        .map((g) => ({
          region: g.region,
          period,
          metricType: "ALERT" as const,
          payload: {
            message: `High traveler interest in ${g.region} with limited supply (${g.supply} listings vs ${g.demand} searches).`,
            ...g,
          },
        })),
    ],
  });

  return { gaps, bookingByRegion, demandByRegion };
}
