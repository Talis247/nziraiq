import { prisma } from "@/lib/db";
import { aggregateInsights } from "@/lib/intelligence/aggregate";

export type GapRow = {
  region: string;
  demand: number;
  supply: number;
  capacity: number;
  gapScore: number;
  opportunity: boolean;
};

export type FunnelStep = {
  key: string;
  label: string;
  value: number;
  rateFromPrev: number | null;
};

export type ListingPerformance = {
  id: string;
  title: string;
  region: string;
  type: string;
  status: string;
  views: number;
  bookings: number;
  revenue: number;
  conversionRate: number;
};

export type OperatorQueueItem = {
  id: string;
  businessName: string;
  type: string;
  verificationStatus: string;
  plan: string;
  phone: string | null;
  listingCount: number;
  createdAt: string;
  email: string;
};

export type AdminBookingRow = {
  id: string;
  title: string;
  region: string;
  status: string;
  guests: number;
  totalPrice: number;
  travelerName: string | null;
  operatorName: string;
  createdAt: string;
  startDate: string;
};

export type NarrativeInsight = {
  tone: "opportunity" | "risk" | "neutral" | "win";
  title: string;
  detail: string;
};

export type AdminAnalytics = {
  generatedAt: string;
  periodDays: number;
  kpis: {
    tourists: number;
    operators: number;
    admins: number;
    activeListings: number;
    pausedListings: number;
    draftListings: number;
    searches30d: number;
    bookings30d: number;
    openRequests: number;
    revenue30d: number;
    listingViews30d: number;
    pendingOperators: number;
    confirmedBookings30d: number;
    avgBookingValue: number;
    searchToViewRate: number;
    viewToBookRate: number;
    bookToConfirmRate: number;
    newTourists7d: number;
    newOperators7d: number;
    searchesPrev7d: number;
    searchesLast7d: number;
    bookingsPrev7d: number;
    bookingsLast7d: number;
  };
  funnel: FunnelStep[];
  narratives: NarrativeInsight[];
  bookingsByStatus: { status: string; count: number }[];
  listingsByType: { type: string; count: number }[];
  listingsByStatus: { status: string; count: number }[];
  usersByRole: { role: string; count: number }[];
  demandByInterest: { interest: string; count: number }[];
  demandByBudget: { band: string; count: number }[];
  dailyActivity: { date: string; searches: number; bookings: number; views: number }[];
  gaps: GapRow[];
  bookingByRegion: Record<string, { count: number; revenue: number }>;
  demandByRegion: Record<string, number>;
  alerts: { region: string; message: string }[];
  topRegions: {
    region: string;
    demand: number;
    supply: number;
    bookings: number;
    revenue: number;
    conversion: number;
  }[];
  topListings: ListingPerformance[];
  coldListings: ListingPerformance[];
  pendingOperators: OperatorQueueItem[];
  recentBookings: AdminBookingRow[];
  openBookings: AdminBookingRow[];
  controllableListings: {
    id: string;
    title: string;
    region: string;
    type: string;
    status: string;
    operatorName: string;
    views30d: number;
  }[];
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 1000) / 10;
}

function deltaPct(current: number, previous: number) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function buildNarratives(input: {
  alerts: { region: string; message: string }[];
  funnel: FunnelStep[];
  kpis: AdminAnalytics["kpis"];
  topRegions: AdminAnalytics["topRegions"];
  coldListings: ListingPerformance[];
  pendingOperators: number;
}): NarrativeInsight[] {
  const out: NarrativeInsight[] = [];
  const { kpis, funnel, alerts, topRegions, coldListings, pendingOperators } = input;

  const searchDelta = deltaPct(kpis.searchesLast7d, kpis.searchesPrev7d);
  if (kpis.searchesLast7d || kpis.searchesPrev7d) {
    out.push({
      tone: searchDelta >= 0 ? "win" : "risk",
      title:
        searchDelta >= 0
          ? `Search demand up ${searchDelta}% week-on-week`
          : `Search demand down ${Math.abs(searchDelta)}% week-on-week`,
      detail: `${kpis.searchesLast7d} searches in the last 7 days vs ${kpis.searchesPrev7d} the week before.`,
    });
  }

  const viewToBook = funnel.find((f) => f.key === "bookings")?.rateFromPrev;
  if (viewToBook != null) {
    out.push({
      tone: viewToBook < 5 ? "risk" : viewToBook > 12 ? "win" : "neutral",
      title: `View → book conversion at ${viewToBook}%`,
      detail:
        viewToBook < 5
          ? "Tourists are browsing but not committing. Check pricing, availability, and photo quality on cold listings."
          : "Marketplace is converting interest into booking requests at a healthy rate.",
    });
  }

  if (alerts[0]) {
    out.push({
      tone: "opportunity",
      title: `Supply gap: ${alerts[0].region}`,
      detail: alerts[0].message,
    });
  }

  const leader = topRegions.find((r) => r.bookings > 0) || topRegions[0];
  if (leader) {
    out.push({
      tone: "neutral",
      title: `${leader.region} leads regional activity`,
      detail: `${leader.demand} searches, ${leader.supply} listings, ${leader.bookings} bookings (${formatMoneySafe(leader.revenue)} confirmed pipeline).`,
    });
  }

  if (pendingOperators > 0) {
    out.push({
      tone: "opportunity",
      title: `${pendingOperators} operator${pendingOperators === 1 ? "" : "s"} awaiting verification`,
      detail: "Verify trusted operators to unlock more live inventory and improve traveler trust.",
    });
  }

  if (coldListings.length > 0) {
    out.push({
      tone: "risk",
      title: `${coldListings.length} high-view listings with zero bookings`,
      detail: `"${coldListings[0].title}" has ${coldListings[0].views} views and no requests — pause, reprice, or coach the operator.`,
    });
  }

  if (kpis.openRequests > 0) {
    out.push({
      tone: "opportunity",
      title: `${kpis.openRequests} open booking request${kpis.openRequests === 1 ? "" : "s"}`,
      detail: "Admin can confirm or decline stalled requests so tourists are not left waiting.",
    });
  }

  return out.slice(0, 6);
}

function formatMoneySafe(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export async function getAdminAnalytics(options?: { refresh?: boolean }): Promise<AdminAnalytics> {
  const periodDays = 30;
  const since = new Date();
  since.setDate(since.getDate() - periodDays);

  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const since14 = new Date();
  since14.setDate(since14.getDate() - 14);

  if (options?.refresh) {
    await aggregateInsights();
  }

  let gapInsight = await prisma.insight.findFirst({
    where: { metricType: "DEMAND_SUPPLY_GAP", period: "last_30_days" },
    orderBy: { updatedAt: "desc" },
  });
  if (!gapInsight) {
    await aggregateInsights();
    gapInsight = await prisma.insight.findFirst({
      where: { metricType: "DEMAND_SUPPLY_GAP", period: "last_30_days" },
    });
  }

  const [
    trend,
    alertRows,
    roleCounts,
    typeCounts,
    statusCounts,
    listingStatusCounts,
    recentBookingsRaw,
    openBookingsRaw,
    liveCounts,
    searchEvents,
    bookingEvents,
    viewEvents,
    interestEvents,
    budgetEvents,
    viewGroups,
    bookingGroups,
    pendingOps,
    controllable,
  ] = await Promise.all([
    prisma.insight.findFirst({
      where: { metricType: "TREND", period: "last_30_days" },
    }),
    prisma.insight.findMany({
      where: { metricType: "ALERT", period: "last_30_days" },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.listing.groupBy({
      by: ["type"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.listing.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.booking.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          select: {
            title: true,
            region: true,
            operator: { select: { businessName: true } },
          },
        },
        traveler: { select: { name: true, email: true } },
      },
    }),
    prisma.booking.findMany({
      where: { status: "REQUESTED" },
      take: 15,
      orderBy: { createdAt: "asc" },
      include: {
        listing: {
          select: {
            title: true,
            region: true,
            operator: { select: { businessName: true } },
          },
        },
        traveler: { select: { name: true, email: true } },
      },
    }),
    Promise.all([
      prisma.user.count({ where: { role: "TRAVELER" } }),
      prisma.user.count({ where: { role: "OPERATOR" } }),
      prisma.user.count({ where: { role: { in: ["ADMIN", "STAKEHOLDER"] } } }),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.listing.count({ where: { status: "PAUSED" } }),
      prisma.listing.count({ where: { status: "DRAFT" } }),
      prisma.searchEvent.count({ where: { createdAt: { gte: since } } }),
      prisma.booking.count({ where: { createdAt: { gte: since } } }),
      prisma.booking.count({ where: { status: "REQUESTED" } }),
      prisma.booking.aggregate({
        where: {
          createdAt: { gte: since },
          status: { in: ["CONFIRMED", "PAID"] },
        },
        _sum: { totalPrice: true },
        _count: { _all: true },
        _avg: { totalPrice: true },
      }),
      prisma.listingView.count({ where: { createdAt: { gte: since } } }),
      prisma.operatorProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.user.count({ where: { role: "TRAVELER", createdAt: { gte: since7 } } }),
      prisma.user.count({ where: { role: "OPERATOR", createdAt: { gte: since7 } } }),
      prisma.searchEvent.count({ where: { createdAt: { gte: since7 } } }),
      prisma.searchEvent.count({
        where: { createdAt: { gte: since14, lt: since7 } },
      }),
      prisma.booking.count({ where: { createdAt: { gte: since7 } } }),
      prisma.booking.count({
        where: { createdAt: { gte: since14, lt: since7 } },
      }),
    ]),
    prisma.searchEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.booking.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.listingView.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.searchEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { interests: true },
      take: 2000,
    }),
    prisma.searchEvent.groupBy({
      by: ["budgetBand"],
      where: { createdAt: { gte: since }, budgetBand: { not: null } },
      _count: { _all: true },
    }),
    prisma.listingView.groupBy({
      by: ["listingId"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { listingId: "desc" } },
      take: 40,
    }),
    prisma.booking.groupBy({
      by: ["listingId"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { totalPrice: true },
    }),
    prisma.operatorProfile.findMany({
      where: { verificationStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 20,
      include: {
        user: { select: { email: true } },
        _count: { select: { listings: true } },
      },
    }),
    prisma.listing.findMany({
      where: { status: { in: ["ACTIVE", "PAUSED"] } },
      orderBy: { updatedAt: "desc" },
      take: 25,
      select: {
        id: true,
        title: true,
        region: true,
        type: true,
        status: true,
        operator: { select: { businessName: true } },
      },
    }),
  ]);

  const [
    tourists,
    operators,
    admins,
    activeListings,
    pausedListings,
    draftListings,
    searches30d,
    bookings30d,
    openRequests,
    revenueAgg,
    listingViews30d,
    pendingOperatorCount,
    newTourists7d,
    newOperators7d,
    searchesLast7d,
    searchesPrev7d,
    bookingsLast7d,
    bookingsPrev7d,
  ] = liveCounts;

  const gaps = ((gapInsight?.payload as { gaps?: GapRow[] })?.gaps) || [];
  const bookingByRegion =
    ((trend?.payload as { bookingByRegion?: Record<string, { count: number; revenue: number }> })
      ?.bookingByRegion) || {};
  const demandByRegion =
    ((trend?.payload as { demandByRegion?: Record<string, number> })?.demandByRegion) || {};

  const seen = new Set<string>();
  const alerts = alertRows
    .filter((a) => {
      if (seen.has(a.region)) return false;
      seen.add(a.region);
      return true;
    })
    .map((a) => ({
      region: a.region,
      message: (a.payload as { message?: string }).message || a.region,
    }));

  const dailyMap: Record<string, { searches: number; bookings: number; views: number }> = {};
  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap[dayKey(d)] = { searches: 0, bookings: 0, views: 0 };
  }
  for (const e of searchEvents) {
    const k = dayKey(e.createdAt);
    if (dailyMap[k]) dailyMap[k].searches += 1;
  }
  for (const e of bookingEvents) {
    const k = dayKey(e.createdAt);
    if (dailyMap[k]) dailyMap[k].bookings += 1;
  }
  for (const e of viewEvents) {
    const k = dayKey(e.createdAt);
    if (dailyMap[k]) dailyMap[k].views += 1;
  }

  const dailyActivity = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }));

  const confirmedBookings30d = revenueAgg._count._all;
  const revenue30d = revenueAgg._sum.totalPrice || 0;
  const avgBookingValue = revenueAgg._avg.totalPrice || 0;

  const searchToViewRate = pct(listingViews30d, searches30d);
  const viewToBookRate = pct(bookings30d, listingViews30d);
  const bookToConfirmRate = pct(confirmedBookings30d, bookings30d);

  const funnel: FunnelStep[] = [
    { key: "searches", label: "Searches", value: searches30d, rateFromPrev: null },
    {
      key: "views",
      label: "Listing views",
      value: listingViews30d,
      rateFromPrev: searchToViewRate,
    },
    {
      key: "bookings",
      label: "Booking requests",
      value: bookings30d,
      rateFromPrev: viewToBookRate,
    },
    {
      key: "confirmed",
      label: "Confirmed / paid",
      value: confirmedBookings30d,
      rateFromPrev: bookToConfirmRate,
    },
  ];

  const interestMap: Record<string, number> = {};
  for (const e of interestEvents) {
    for (const i of e.interests) {
      const key = i.trim().toLowerCase();
      if (!key) continue;
      interestMap[key] = (interestMap[key] || 0) + 1;
    }
  }
  const demandByInterest = Object.entries(interestMap)
    .map(([interest, count]) => ({ interest, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const demandByBudget = budgetEvents
    .map((b) => ({ band: b.budgetBand || "unknown", count: b._count._all }))
    .sort((a, b) => b.count - a.count);

  const listingIds = Array.from(
    new Set([...viewGroups.map((v) => v.listingId), ...bookingGroups.map((b) => b.listingId)]),
  );
  const listingMeta =
    listingIds.length === 0
      ? []
      : await prisma.listing.findMany({
          where: { id: { in: listingIds } },
          select: { id: true, title: true, region: true, type: true, status: true },
        });
  const metaMap = Object.fromEntries(listingMeta.map((l) => [l.id, l]));
  const bookMap = Object.fromEntries(
    bookingGroups.map((b) => [
      b.listingId,
      { count: b._count._all, revenue: b._sum.totalPrice || 0 },
    ]),
  );
  const viewMap = Object.fromEntries(viewGroups.map((v) => [v.listingId, v._count._all]));

  const performance: ListingPerformance[] = listingIds
    .map((id) => {
      const meta = metaMap[id];
      if (!meta) return null;
      const views = viewMap[id] || 0;
      const bookings = bookMap[id]?.count || 0;
      return {
        id,
        title: meta.title,
        region: meta.region,
        type: meta.type,
        status: meta.status,
        views,
        bookings,
        revenue: bookMap[id]?.revenue || 0,
        conversionRate: pct(bookings, views),
      };
    })
    .filter(Boolean) as ListingPerformance[];

  const topListings = [...performance]
    .sort((a, b) => b.bookings - a.bookings || b.views - a.views)
    .slice(0, 8);
  const coldListings = [...performance]
    .filter((p) => p.views >= 3 && p.bookings === 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const topRegions = gaps.slice(0, 10).map((g) => {
    const bookings = bookingByRegion[g.region]?.count || 0;
    const revenue = bookingByRegion[g.region]?.revenue || 0;
    return {
      region: g.region,
      demand: g.demand,
      supply: g.supply,
      bookings,
      revenue,
      conversion: pct(bookings, g.demand),
    };
  });

  const mapBooking = (b: (typeof recentBookingsRaw)[number]): AdminBookingRow => ({
    id: b.id,
    title: b.listing.title,
    region: b.listing.region,
    status: b.status,
    guests: b.guests,
    totalPrice: b.totalPrice,
    travelerName: b.traveler.name || b.traveler.email,
    operatorName: b.listing.operator.businessName,
    createdAt: b.createdAt.toISOString(),
    startDate: b.startDate.toISOString(),
  });

  const pendingOperators: OperatorQueueItem[] = pendingOps.map((o) => ({
    id: o.id,
    businessName: o.businessName,
    type: o.type,
    verificationStatus: o.verificationStatus,
    plan: o.plan,
    phone: o.phone,
    listingCount: o._count.listings,
    createdAt: o.createdAt.toISOString(),
    email: o.user.email,
  }));

  const viewByListing = Object.fromEntries(viewGroups.map((v) => [v.listingId, v._count._all]));
  const controllableListings = controllable.map((l) => ({
    id: l.id,
    title: l.title,
    region: l.region,
    type: l.type,
    status: l.status,
    operatorName: l.operator.businessName,
    views30d: viewByListing[l.id] || 0,
  }));

  const kpis = {
    tourists,
    operators,
    admins,
    activeListings,
    pausedListings,
    draftListings,
    searches30d,
    bookings30d,
    openRequests,
    revenue30d,
    listingViews30d,
    pendingOperators: pendingOperatorCount,
    confirmedBookings30d,
    avgBookingValue,
    searchToViewRate,
    viewToBookRate,
    bookToConfirmRate,
    newTourists7d,
    newOperators7d,
    searchesPrev7d,
    searchesLast7d,
    bookingsPrev7d,
    bookingsLast7d,
  };

  const narratives = buildNarratives({
    alerts,
    funnel,
    kpis,
    topRegions,
    coldListings,
    pendingOperators: pendingOperatorCount,
  });

  return {
    generatedAt: new Date().toISOString(),
    periodDays,
    kpis,
    funnel,
    narratives,
    bookingsByStatus: statusCounts.map((s) => ({
      status: s.status,
      count: s._count._all,
    })),
    listingsByType: typeCounts.map((t) => ({
      type: t.type,
      count: t._count._all,
    })),
    listingsByStatus: listingStatusCounts.map((s) => ({
      status: s.status,
      count: s._count._all,
    })),
    usersByRole: roleCounts.map((r) => ({
      role: r.role,
      count: r._count._all,
    })),
    demandByInterest,
    demandByBudget,
    dailyActivity,
    gaps,
    bookingByRegion,
    demandByRegion,
    alerts,
    topRegions,
    topListings,
    coldListings,
    pendingOperators,
    recentBookings: recentBookingsRaw.map(mapBooking),
    openBookings: openBookingsRaw.map(mapBooking),
    controllableListings,
  };
}
