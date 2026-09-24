import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminAnalytics } from "@/lib/intelligence/admin-analytics";

function toCsv(rows: Record<string, string | number>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(","))].join(
    "\n",
  );
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAKEHOLDER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";
  const dataset = searchParams.get("dataset") || "full";
  const refresh = searchParams.get("refresh") === "1";

  const data = await getAdminAnalytics({ refresh });

  if (format === "csv") {
    let rows: Record<string, string | number>[] = [];
    if (dataset === "gaps") {
      rows = data.gaps.map((g) => ({
        region: g.region,
        demand: g.demand,
        supply: g.supply,
        capacity: g.capacity,
        gapScore: g.gapScore,
        opportunity: g.opportunity ? 1 : 0,
      }));
    } else if (dataset === "daily") {
      rows = data.dailyActivity;
    } else if (dataset === "bookings") {
      rows = data.recentBookings.map((b) => ({
        id: b.id,
        title: b.title,
        region: b.region,
        status: b.status,
        guests: b.guests,
        totalPrice: b.totalPrice,
        travelerName: b.travelerName || "",
        operatorName: b.operatorName,
        createdAt: b.createdAt,
      }));
    } else if (dataset === "listings-by-type") {
      rows = data.listingsByType;
    } else if (dataset === "top-listings") {
      rows = data.topListings.map((l) => ({
        id: l.id,
        title: l.title,
        region: l.region,
        type: l.type,
        status: l.status,
        views: l.views,
        bookings: l.bookings,
        revenue: l.revenue,
        conversionRate: l.conversionRate,
      }));
    } else if (dataset === "regions") {
      rows = data.topRegions.map((r) => ({
        region: r.region,
        demand: r.demand,
        supply: r.supply,
        bookings: r.bookings,
        revenue: r.revenue,
        conversion: r.conversion,
      }));
    } else if (dataset === "funnel") {
      rows = data.funnel.map((f) => ({
        step: f.key,
        label: f.label,
        value: f.value,
        rateFromPrev: f.rateFromPrev ?? "",
      }));
    } else {
      rows = [
        {
          generatedAt: data.generatedAt,
          tourists: data.kpis.tourists,
          operators: data.kpis.operators,
          admins: data.kpis.admins,
          activeListings: data.kpis.activeListings,
          pausedListings: data.kpis.pausedListings,
          searches30d: data.kpis.searches30d,
          bookings30d: data.kpis.bookings30d,
          openRequests: data.kpis.openRequests,
          revenue30d: data.kpis.revenue30d,
          listingViews30d: data.kpis.listingViews30d,
          searchToViewRate: data.kpis.searchToViewRate,
          viewToBookRate: data.kpis.viewToBookRate,
          bookToConfirmRate: data.kpis.bookToConfirmRate,
          avgBookingValue: data.kpis.avgBookingValue,
        },
      ];
    }

    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nziraiq-${dataset}-${data.generatedAt.slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(data, {
    headers: {
      "Content-Disposition": `attachment; filename="nziraiq-analytics-${data.generatedAt.slice(0, 10)}.json"`,
    },
  });
}
