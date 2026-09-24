import { prisma } from "@/lib/db";

export type OperatorListingStat = {
  id: string;
  title: string;
  type: string;
  region: string;
  status: string;
  views: number;
  bookings: number;
  revenue: number;
  conversionRate: number;
};

export type OperatorInsight = {
  tone: "win" | "risk" | "tip" | "neutral";
  title: string;
  detail: string;
};

export type OperatorAnalytics = {
  generatedAt: string;
  businessName: string;
  periodDays: number;
  kpis: {
    views30d: number;
    bookings30d: number;
    openRequests: number;
    confirmed30d: number;
    revenue30d: number;
    avgBookingValue: number;
    viewToBookRate: number;
    bookToConfirmRate: number;
    activeListings: number;
    viewsLast7d: number;
    viewsPrev7d: number;
    bookingsLast7d: number;
    bookingsPrev7d: number;
  };
  funnel: { label: string; value: number; rateFromPrev: number | null }[];
  daily: { date: string; searches: number; bookings: number; views: number }[];
  bookingsByStatus: { status: string; count: number }[];
  listingStats: OperatorListingStat[];
  insights: OperatorInsight[];
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

export async function getOperatorAnalytics(operatorUserId: string): Promise<OperatorAnalytics | null> {
  const operator = await prisma.operatorProfile.findUnique({
    where: { userId: operatorUserId },
    include: {
      listings: {
        select: {
          id: true,
          title: true,
          type: true,
          region: true,
          status: true,
        },
      },
    },
  });
  if (!operator) return null;

  const listingIds = operator.listings.map((l) => l.id);
  const periodDays = 30;
  const since = new Date();
  since.setDate(since.getDate() - periodDays);
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const since14 = new Date();
  since14.setDate(since14.getDate() - 14);

  if (listingIds.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      businessName: operator.businessName,
      periodDays,
      kpis: {
        views30d: 0,
        bookings30d: 0,
        openRequests: 0,
        confirmed30d: 0,
        revenue30d: 0,
        avgBookingValue: 0,
        viewToBookRate: 0,
        bookToConfirmRate: 0,
        activeListings: 0,
        viewsLast7d: 0,
        viewsPrev7d: 0,
        bookingsLast7d: 0,
        bookingsPrev7d: 0,
      },
      funnel: [
        { label: "Listing views", value: 0, rateFromPrev: null },
        { label: "Booking requests", value: 0, rateFromPrev: 0 },
        { label: "Confirmed / paid", value: 0, rateFromPrev: 0 },
      ],
      daily: Array.from({ length: periodDays }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (periodDays - 1 - i));
        return { date: dayKey(d), searches: 0, bookings: 0, views: 0 };
      }),
      bookingsByStatus: [],
      listingStats: [],
      insights: [
        {
          tone: "tip",
          title: "Publish your first listing",
          detail:
            "Add photos and go live — insights appear as travelers view and book your services.",
        },
      ],
    };
  }

  const [
    views30d,
    bookings30d,
    openRequests,
    confirmedAgg,
    statusCounts,
    viewEvents,
    bookingEvents,
    viewsLast7d,
    viewsPrev7d,
    bookingsLast7d,
    bookingsPrev7d,
    viewsByListing,
    bookingsByListing,
  ] = await Promise.all([
    prisma.listingView.count({
      where: { listingId: { in: listingIds }, createdAt: { gte: since } },
    }),
    prisma.booking.count({
      where: { listingId: { in: listingIds }, createdAt: { gte: since } },
    }),
    prisma.booking.count({
      where: { listingId: { in: listingIds }, status: "REQUESTED" },
    }),
    prisma.booking.aggregate({
      where: {
        listingId: { in: listingIds },
        createdAt: { gte: since },
        status: { in: ["CONFIRMED", "PAID"] },
      },
      _sum: { totalPrice: true },
      _count: { _all: true },
      _avg: { totalPrice: true },
    }),
    prisma.booking.groupBy({
      by: ["status"],
      where: { listingId: { in: listingIds } },
      _count: { _all: true },
    }),
    prisma.listingView.findMany({
      where: { listingId: { in: listingIds }, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.booking.findMany({
      where: { listingId: { in: listingIds }, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.listingView.count({
      where: { listingId: { in: listingIds }, createdAt: { gte: since7 } },
    }),
    prisma.listingView.count({
      where: {
        listingId: { in: listingIds },
        createdAt: { gte: since14, lt: since7 },
      },
    }),
    prisma.booking.count({
      where: { listingId: { in: listingIds }, createdAt: { gte: since7 } },
    }),
    prisma.booking.count({
      where: {
        listingId: { in: listingIds },
        createdAt: { gte: since14, lt: since7 },
      },
    }),
    prisma.listingView.groupBy({
      by: ["listingId"],
      where: { listingId: { in: listingIds }, createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["listingId"],
      where: { listingId: { in: listingIds }, createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { totalPrice: true },
    }),
  ]);

  const confirmed30d = confirmedAgg._count._all;
  const revenue30d = confirmedAgg._sum.totalPrice || 0;
  const avgBookingValue = confirmedAgg._avg.totalPrice || 0;
  const viewToBookRate = pct(bookings30d, views30d);
  const bookToConfirmRate = pct(confirmed30d, bookings30d);

  const dailyMap: Record<string, { searches: number; bookings: number; views: number }> = {};
  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap[dayKey(d)] = { searches: 0, bookings: 0, views: 0 };
  }
  for (const e of viewEvents) {
    const k = dayKey(e.createdAt);
    if (dailyMap[k]) dailyMap[k].views += 1;
  }
  for (const e of bookingEvents) {
    const k = dayKey(e.createdAt);
    if (dailyMap[k]) dailyMap[k].bookings += 1;
  }

  const viewMap = Object.fromEntries(viewsByListing.map((v) => [v.listingId, v._count._all]));
  const bookMap = Object.fromEntries(
    bookingsByListing.map((b) => [
      b.listingId,
      { count: b._count._all, revenue: b._sum.totalPrice || 0 },
    ]),
  );

  const listingStats: OperatorListingStat[] = operator.listings
    .map((l) => {
      const views = viewMap[l.id] || 0;
      const bookings = bookMap[l.id]?.count || 0;
      return {
        id: l.id,
        title: l.title,
        type: l.type,
        region: l.region,
        status: l.status,
        views,
        bookings,
        revenue: bookMap[l.id]?.revenue || 0,
        conversionRate: pct(bookings, views),
      };
    })
    .sort((a, b) => b.views - a.views || b.bookings - a.bookings);

  const activeListings = operator.listings.filter((l) => l.status === "ACTIVE").length;
  const top = listingStats.find((l) => l.bookings > 0) || listingStats[0];
  const cold = listingStats.filter((l) => l.views >= 3 && l.bookings === 0);

  const insights: OperatorInsight[] = [];
  const viewDelta = deltaPct(viewsLast7d, viewsPrev7d);
  if (viewsLast7d || viewsPrev7d) {
    insights.push({
      tone: viewDelta >= 0 ? "win" : "risk",
      title:
        viewDelta >= 0
          ? `Views up ${viewDelta}% this week`
          : `Views down ${Math.abs(viewDelta)}% this week`,
      detail: `${viewsLast7d} views in the last 7 days vs ${viewsPrev7d} the week before.`,
    });
  }

  if (top && top.views > 0) {
    insights.push({
      tone: top.bookings > 0 ? "win" : "neutral",
      title: top.bookings > 0 ? `"${top.title}" is your lead listing` : `"${top.title}" gets the most eyes`,
      detail:
        top.bookings > 0
          ? `${top.views} views → ${top.bookings} requests (${top.conversionRate}% conversion).`
          : `${top.views} views but no requests yet — check price, photos, and availability.`,
    });
  }

  if (viewToBookRate > 0) {
    insights.push({
      tone: viewToBookRate < 5 ? "risk" : viewToBookRate > 12 ? "win" : "tip",
      title: `View → book at ${viewToBookRate}%`,
      detail:
        viewToBookRate < 5
          ? "Many browse, few request. Strengthen photos, clarify what’s included, and keep dates open."
          : "Travelers who find you are requesting bookings at a solid rate.",
    });
  }

  if (openRequests > 0) {
    insights.push({
      tone: "tip",
      title: `${openRequests} open request${openRequests === 1 ? "" : "s"} waiting`,
      detail: "Fast replies lift confirmations — open your booking inbox and respond today.",
    });
  }

  if (cold.length > 0) {
    insights.push({
      tone: "risk",
      title: `${cold.length} listing${cold.length === 1 ? "" : "s"} with views but no bookings`,
      detail: `"${cold[0].title}" has ${cold[0].views} views and zero requests.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      tone: "tip",
      title: "Keep listings fresh",
      detail: "Add recent photos and availability — activity grows as travelers discover you on Explore.",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    businessName: operator.businessName,
    periodDays,
    kpis: {
      views30d,
      bookings30d,
      openRequests,
      confirmed30d,
      revenue30d,
      avgBookingValue,
      viewToBookRate,
      bookToConfirmRate,
      activeListings,
      viewsLast7d,
      viewsPrev7d,
      bookingsLast7d,
      bookingsPrev7d,
    },
    funnel: [
      { label: "Listing views", value: views30d, rateFromPrev: null },
      { label: "Booking requests", value: bookings30d, rateFromPrev: viewToBookRate },
      {
        label: "Confirmed / paid",
        value: confirmed30d,
        rateFromPrev: bookToConfirmRate,
      },
    ],
    daily: Object.entries(dailyMap).map(([date, v]) => ({ date, ...v })),
    bookingsByStatus: statusCounts.map((s) => ({
      status: s.status,
      count: s._count._all,
    })),
    listingStats,
    insights: insights.slice(0, 5),
  };
}
