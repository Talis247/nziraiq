"use client";

import Link from "next/link";
import {
  Eye,
  Inbox,
  TrendingUp,
  Wallet,
  ListTree,
} from "lucide-react";
import type { OperatorAnalytics } from "@/lib/intelligence/operator-analytics";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { AreaTrendChart, DonutChart, FunnelBars } from "@/components/admin/Charts";

function wow(current: number, previous: number) {
  if (!previous && !current) return "flat";
  if (!previous) return "+100%";
  const d = Math.round(((current - previous) / previous) * 100);
  if (d === 0) return "flat";
  return d > 0 ? `+${d}%` : `${d}%`;
}

const toneClass = {
  win: "bg-zim-green/10",
  risk: "bg-zim-red/[0.08]",
  tip: "bg-zim-gold/10",
  neutral: "bg-black/[0.04]",
} as const;

export function OperatorAnalyticsView({ data }: { data: OperatorAnalytics }) {
  const kpis = [
    {
      label: "Views (30d)",
      value: String(data.kpis.views30d),
      icon: Eye,
      hint: `${wow(data.kpis.viewsLast7d, data.kpis.viewsPrev7d)} WoW`,
    },
    {
      label: "Requests (30d)",
      value: String(data.kpis.bookings30d),
      icon: TrendingUp,
      hint: `${wow(data.kpis.bookingsLast7d, data.kpis.bookingsPrev7d)} WoW`,
    },
    {
      label: "Open inbox",
      value: String(data.kpis.openRequests),
      icon: Inbox,
      hint: "Awaiting your reply",
    },
    {
      label: "Confirmed value",
      value: formatMoney(data.kpis.revenue30d),
      icon: Wallet,
      hint: `Avg ${formatMoney(data.kpis.avgBookingValue)}`,
    },
  ];

  return (
    <div className="flex flex-col gap-5 sm:gap-6 lg:gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zim-red">
            Insights
          </p>
          <h1 className="mt-1 text-[1.65rem] font-bold leading-tight tracking-tight sm:text-3xl">
            Your performance
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
            Simple read on how travelers find and book {data.businessName}. Updated{" "}
            {formatDateTime(data.generatedAt)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/operator/bookings"
            className="inline-flex items-center gap-1.5 rounded-full bg-zim-black px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Inbox className="h-4 w-4" />
            Inbox
            {data.kpis.openRequests > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                {data.kpis.openRequests}
              </span>
            )}
          </Link>
          <Link
            href="/operator/listings"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-black/10"
          >
            <ListTree className="h-4 w-4" />
            Listings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="rounded-[1.15rem] bg-white p-3.5 ring-1 ring-black/[0.06] sm:rounded-[1.25rem] sm:p-5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zim-green/10 sm:h-9 sm:w-9">
                <Icon className="h-3.5 w-3.5 text-zim-green sm:h-4 sm:w-4" />
              </div>
              <p className="mt-2.5 text-lg font-bold tracking-tight sm:mt-3 sm:text-2xl">
                {k.value}
              </p>
              <p className="mt-0.5 text-xs font-semibold">{k.label}</p>
              <p className="text-[11px] text-muted">{k.hint}</p>
            </div>
          );
        })}
      </div>

      <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-zim-green" />
          <h2 className="font-bold">What matters now</h2>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {data.insights.map((n) => (
            <article
              key={n.title + n.detail}
              className={`rounded-[1.1rem] p-3.5 sm:p-4 ${toneClass[n.tone]}`}
            >
              <p className="text-sm font-bold">{n.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed opacity-80">{n.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5 lg:col-span-2">
          <h2 className="mb-4 font-bold">Activity (30 days)</h2>
          <AreaTrendChart points={data.daily} series={["views", "bookings"]} />
        </section>
        <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
          <h2 className="mb-4 font-bold">Your funnel</h2>
          <FunnelBars steps={data.funnel} />
          <p className="mt-4 text-xs text-muted">
            {data.kpis.activeListings} active{" "}
            {data.kpis.activeListings === 1 ? "listing" : "listings"} · confirm rate{" "}
            {data.kpis.bookToConfirmRate}%
          </p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
        <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5 lg:col-span-2">
          <h2 className="mb-4 font-bold">Bookings by status</h2>
          {data.bookingsByStatus.length === 0 ? (
            <p className="text-sm text-muted">No bookings yet.</p>
          ) : (
            <DonutChart
              segments={data.bookingsByStatus.map((s) => ({
                label: s.status,
                value: s.count,
              }))}
              centerValue={String(data.bookingsByStatus.reduce((a, s) => a + s.count, 0))}
              centerLabel="Total"
              size={140}
            />
          )}
        </section>

        <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5 lg:col-span-3">
          <h2 className="mb-4 font-bold">Listing performance</h2>
          {data.listingStats.length === 0 ? (
            <p className="text-sm text-muted">
              Publish a listing to see views and conversion here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/[0.06] text-xs text-muted">
                    <th className="pb-2 font-medium">Listing</th>
                    <th className="pb-2 font-medium">Views</th>
                    <th className="pb-2 font-medium">Requests</th>
                    <th className="pb-2 font-medium">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.listingStats.map((l) => (
                    <tr key={l.id} className="border-b border-black/[0.04]">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium leading-snug">{l.title}</p>
                        <p className="text-[11px] capitalize text-muted">
                          {l.type.toLowerCase()} · {l.region}
                        </p>
                      </td>
                      <td className="py-2.5 tabular-nums">{l.views}</td>
                      <td className="py-2.5 tabular-nums">{l.bookings}</td>
                      <td className="py-2.5 tabular-nums">{l.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
