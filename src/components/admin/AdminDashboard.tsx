"use client";

import { useMemo, useState, useTransition, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Check,
  Download,
  Pause,
  Play,
  RefreshCw,
  Search,
  Store,
  TrendingUp,
  Users,
  Wallet,
  Eye,
  Inbox,
  Building2,
  Shield,
  X,
} from "lucide-react";
import type { AdminAnalytics } from "@/lib/intelligence/admin-analytics";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";
import {
  AreaTrendChart,
  BarPairChart,
  DonutChart,
  FunnelBars,
} from "@/components/admin/Charts";

type Tab = "overview" | "analytics" | "control" | "export";

function downloadUrl(dataset: string, format: "csv" | "json") {
  return `/api/intelligence/export?dataset=${dataset}&format=${format}`;
}

function deltaLabel(current: number, previous: number) {
  if (!previous && !current) return "flat";
  if (!previous) return "+100%";
  const d = Math.round(((current - previous) / previous) * 100);
  if (d === 0) return "flat";
  return d > 0 ? `+${d}%` : `${d}%`;
}

export function AdminDashboard({ data }: { data: AdminAnalytics }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const kpis = useMemo(
    () => [
      {
        label: "Tourists",
        value: String(data.kpis.tourists),
        icon: Users,
        hint: `+${data.kpis.newTourists7d} this week`,
      },
      {
        label: "Operators",
        value: String(data.kpis.operators),
        icon: Building2,
        hint: `${data.kpis.pendingOperators} pending verify`,
      },
      {
        label: "Active listings",
        value: String(data.kpis.activeListings),
        icon: Store,
        hint: `${data.kpis.pausedListings} paused`,
      },
      {
        label: "Searches (30d)",
        value: String(data.kpis.searches30d),
        icon: Search,
        hint: `${deltaLabel(data.kpis.searchesLast7d, data.kpis.searchesPrev7d)} WoW`,
      },
      {
        label: "Listing views (30d)",
        value: String(data.kpis.listingViews30d),
        icon: Eye,
        hint: `${data.kpis.searchToViewRate}% of searches`,
      },
      {
        label: "Bookings (30d)",
        value: String(data.kpis.bookings30d),
        icon: TrendingUp,
        hint: `${deltaLabel(data.kpis.bookingsLast7d, data.kpis.bookingsPrev7d)} WoW`,
      },
      {
        label: "Open requests",
        value: String(data.kpis.openRequests),
        icon: Inbox,
        hint: "Needs operator / admin",
      },
      {
        label: "Confirmed value",
        value: formatMoney(data.kpis.revenue30d),
        icon: Wallet,
        hint: `Avg ${formatMoney(data.kpis.avgBookingValue)}`,
      },
    ],
    [data],
  );

  async function refresh() {
    setBusy(true);
    try {
      await fetch("/api/intelligence/dashboard?refresh=1");
      startTransition(() => router.refresh());
      setToast("Insights re-aggregated from live platform data.");
    } finally {
      setBusy(false);
    }
  }

  async function runAction(payload: Record<string, unknown>, key: string, okMsg: string) {
    setActionBusy(key);
    setToast(null);
    try {
      const res = await fetch("/api/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setToast(err.error || "Action failed.");
        return;
      }
      setToast(okMsg);
      startTransition(() => router.refresh());
    } catch {
      setToast("Network error — try again.");
    } finally {
      setActionBusy(null);
    }
  }

  const gapRows = data.gaps.slice(0, 10).map((g) => ({
    label: g.region,
    a: g.demand,
    b: g.supply,
    badge: g.opportunity,
  }));

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "analytics", label: "Deep analytics" },
    { id: "control", label: "Control centre" },
    { id: "export", label: "Export" },
  ];

  const toneClass = {
    opportunity: "bg-zim-gold/10 text-zim-black",
    risk: "bg-zim-red/[0.08] text-zim-black",
    win: "bg-zim-green/10 text-zim-black",
    neutral: "bg-black/[0.04] text-zim-black",
  } as const;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zim-red">Admin</p>
          <h1 className="mt-1 text-[1.7rem] font-bold leading-tight tracking-tight sm:text-3xl">
            Live intelligence
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            Platform control room — analyse demand, steer supply, verify operators, and override
            stalled bookings. Updated {formatDateTime(data.generatedAt)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={busy || pending}
            className="inline-flex items-center gap-2 rounded-full bg-zim-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${busy || pending ? "animate-spin" : ""}`} />
            Refresh insights
          </button>
          <a
            href={downloadUrl("full", "json")}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-black/10"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </a>
        </div>
      </div>

      {toast && (
        <div className="flex items-start justify-between gap-3 rounded-2xl bg-zim-green/10 px-4 py-3 text-sm">
          <p>{toast}</p>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-full bg-black/[0.04] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? "bg-white shadow-sm" : "text-muted hover:text-zim-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <div
                  key={k.label}
                  className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zim-green/10">
                    <Icon className="h-4 w-4 text-zim-green" />
                  </div>
                  <p className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">{k.value}</p>
                  <p className="mt-0.5 text-xs font-semibold">{k.label}</p>
                  <p className="text-[11px] text-muted">{k.hint}</p>
                </div>
              );
            })}
          </div>

          <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-zim-green" />
              <h2 className="font-bold">Analytical brief</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.narratives.map((n) => (
                <article
                  key={n.title + n.detail}
                  className={`rounded-[1.1rem] p-4 ${toneClass[n.tone]}`}
                >
                  <p className="text-sm font-bold">{n.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed opacity-80">{n.detail}</p>
                </article>
              ))}
              {data.narratives.length === 0 && (
                <p className="text-sm text-muted">Collect more traffic to generate briefs.</p>
              )}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-bold">Activity trend (30 days)</h2>
                <a href={downloadUrl("daily", "csv")} className="text-xs font-semibold text-zim-red">
                  Download daily
                </a>
              </div>
              <AreaTrendChart points={data.dailyActivity} />
            </section>

            <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
              <h2 className="mb-4 font-bold">Conversion funnel</h2>
              <FunnelBars steps={data.funnel} />
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-bold">Demand vs supply by region</h2>
                <a href={downloadUrl("gaps", "csv")} className="text-xs font-semibold text-zim-red">
                  Download gaps
                </a>
              </div>
              {gapRows.length === 0 ? (
                <p className="text-sm text-muted">
                  Not enough interaction data yet. Tourist searches will fill this chart.
                </p>
              ) : (
                <BarPairChart rows={gapRows} />
              )}
            </section>

            <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
              <h2 className="mb-4 font-bold">Bookings by status</h2>
              <DonutChart
                segments={data.bookingsByStatus.map((s) => ({
                  label: s.status,
                  value: s.count,
                }))}
                centerValue={String(data.bookingsByStatus.reduce((a, s) => a + s.count, 0))}
                centerLabel="Total"
              />
            </section>
          </div>
        </>
      )}

      {tab === "analytics" && (
        <>
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
              <h2 className="mb-4 font-bold">Listings by type</h2>
              <DonutChart
                segments={data.listingsByType.map((t) => ({
                  label: t.type,
                  value: t.count,
                }))}
                centerValue={String(data.kpis.activeListings)}
                centerLabel="Active"
              />
            </section>
            <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
              <h2 className="mb-4 font-bold">Listing health</h2>
              <DonutChart
                segments={data.listingsByStatus.map((s) => ({
                  label: s.status,
                  value: s.count,
                }))}
                centerValue={String(
                  data.listingsByStatus.reduce((a, s) => a + s.count, 0),
                )}
                centerLabel="All"
              />
            </section>
            <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
              <h2 className="mb-4 font-bold">Accounts</h2>
              <DonutChart
                segments={data.usersByRole.map((r) => ({
                  label: r.role === "TRAVELER" ? "Tourist" : r.role,
                  value: r.count,
                }))}
                centerValue={String(data.usersByRole.reduce((a, r) => a + r.count, 0))}
                centerLabel="Users"
              />
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
              <h2 className="mb-3 font-bold">Demand by interest</h2>
              {data.demandByInterest.length === 0 ? (
                <p className="text-sm text-muted">No interest tags in search events yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.demandByInterest.map((i) => (
                    <li key={i.interest} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{i.interest}</span>
                      <span className="font-semibold tabular-nums">{i.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
              <h2 className="mb-3 font-bold">Demand by budget band</h2>
              {data.demandByBudget.length === 0 ? (
                <p className="text-sm text-muted">No budget signals yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.demandByBudget.map((b) => (
                    <li key={b.band} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{b.band.replaceAll("_", " ")}</span>
                      <span className="font-semibold tabular-nums">{b.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
            <h2 className="mb-4 font-bold">Regional conversion table</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/[0.06] text-xs text-muted">
                    <th className="pb-2 font-medium">Region</th>
                    <th className="pb-2 font-medium">Demand</th>
                    <th className="pb-2 font-medium">Supply</th>
                    <th className="pb-2 font-medium">Bookings</th>
                    <th className="pb-2 font-medium">Revenue</th>
                    <th className="pb-2 font-medium">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topRegions.map((r) => (
                    <tr key={r.region} className="border-b border-black/[0.04]">
                      <td className="py-3 font-medium">{r.region}</td>
                      <td className="py-3 tabular-nums">{r.demand}</td>
                      <td className="py-3 tabular-nums">{r.supply}</td>
                      <td className="py-3 tabular-nums">{r.bookings}</td>
                      <td className="py-3 font-semibold text-zim-green">
                        {formatMoney(r.revenue)}
                      </td>
                      <td className="py-3 tabular-nums">{r.conversion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
              <h2 className="mb-4 font-bold">Top performing listings</h2>
              <ListingTable rows={data.topListings} empty="No booking activity yet." />
            </section>
            <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-zim-red" />
                <h2 className="font-bold">Cold listings (views, 0 books)</h2>
              </div>
              <ListingTable rows={data.coldListings} empty="No cold listings flagged." />
            </section>
          </div>
        </>
      )}

      {tab === "control" && (
        <>
          <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-zim-green" />
              <h2 className="font-bold">Operator verification queue</h2>
            </div>
            {data.pendingOperators.length === 0 ? (
              <p className="text-sm text-muted">No operators waiting for verification.</p>
            ) : (
              <div className="space-y-3">
                {data.pendingOperators.map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-col gap-3 rounded-2xl bg-black/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">{o.businessName}</p>
                      <p className="text-xs text-muted">
                        {o.type.toLowerCase()} · {o.email}
                        {o.phone ? ` · ${o.phone}` : ""} · {o.listingCount} listings · joined{" "}
                        {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={actionBusy === `op-v-${o.id}`}
                        onClick={() =>
                          runAction(
                            {
                              action: "verify_operator",
                              operatorId: o.id,
                              status: "VERIFIED",
                            },
                            `op-v-${o.id}`,
                            `${o.businessName} verified.`,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-full bg-zim-green px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verify
                      </button>
                      <button
                        type="button"
                        disabled={actionBusy === `op-r-${o.id}`}
                        onClick={() =>
                          runAction(
                            {
                              action: "verify_operator",
                              operatorId: o.id,
                              status: "REJECTED",
                            },
                            `op-r-${o.id}`,
                            `${o.businessName} rejected.`,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-full bg-zim-red px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Inbox className="h-5 w-5 text-zim-gold" />
              <h2 className="font-bold">Open booking requests — admin override</h2>
            </div>
            {data.openBookings.length === 0 ? (
              <p className="text-sm text-muted">No open requests.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/[0.06] text-xs text-muted">
                      <th className="pb-2 font-medium">Listing</th>
                      <th className="pb-2 font-medium">Traveler</th>
                      <th className="pb-2 font-medium">Operator</th>
                      <th className="pb-2 font-medium">Value</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.openBookings.map((b) => (
                      <tr key={b.id} className="border-b border-black/[0.04]">
                        <td className="py-3">
                          <p className="font-medium">{b.title}</p>
                          <p className="text-xs text-muted">
                            {b.region} · {formatDate(b.startDate)}
                          </p>
                        </td>
                        <td className="py-3 text-muted">{b.travelerName}</td>
                        <td className="py-3 text-muted">{b.operatorName}</td>
                        <td className="py-3 font-semibold text-zim-green">
                          {b.totalPrice > 0 ? formatMoney(b.totalPrice) : "On request"}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <ActionChip
                              busy={actionBusy === `bk-c-${b.id}`}
                              onClick={() =>
                                runAction(
                                  {
                                    action: "set_booking_status",
                                    bookingId: b.id,
                                    status: "CONFIRMED",
                                  },
                                  `bk-c-${b.id}`,
                                  "Booking confirmed.",
                                )
                              }
                              icon={Check}
                              label="Confirm"
                              tone="green"
                            />
                            <ActionChip
                              busy={actionBusy === `bk-d-${b.id}`}
                              onClick={() =>
                                runAction(
                                  {
                                    action: "set_booking_status",
                                    bookingId: b.id,
                                    status: "DECLINED",
                                  },
                                  `bk-d-${b.id}`,
                                  "Booking declined.",
                                )
                              }
                              icon={X}
                              label="Decline"
                              tone="red"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
            <h2 className="mb-4 font-bold">Marketplace listing controls</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/[0.06] text-xs text-muted">
                    <th className="pb-2 font-medium">Listing</th>
                    <th className="pb-2 font-medium">Operator</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Views 30d</th>
                    <th className="pb-2 font-medium">Control</th>
                  </tr>
                </thead>
                <tbody>
                  {data.controllableListings.map((l) => (
                    <tr key={l.id} className="border-b border-black/[0.04]">
                      <td className="py-3">
                        <p className="font-medium">{l.title}</p>
                        <p className="text-xs capitalize text-muted">
                          {l.type.toLowerCase()} · {l.region}
                        </p>
                      </td>
                      <td className="py-3 text-muted">{l.operatorName}</td>
                      <td className="py-3 capitalize text-muted">{l.status.toLowerCase()}</td>
                      <td className="py-3 tabular-nums">{l.views30d}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {l.status !== "ACTIVE" && (
                            <ActionChip
                              busy={actionBusy === `ls-a-${l.id}`}
                              onClick={() =>
                                runAction(
                                  {
                                    action: "set_listing_status",
                                    listingId: l.id,
                                    status: "ACTIVE",
                                  },
                                  `ls-a-${l.id}`,
                                  "Listing activated.",
                                )
                              }
                              icon={Play}
                              label="Activate"
                              tone="green"
                            />
                          )}
                          {l.status !== "PAUSED" && (
                            <ActionChip
                              busy={actionBusy === `ls-p-${l.id}`}
                              onClick={() =>
                                runAction(
                                  {
                                    action: "set_listing_status",
                                    listingId: l.id,
                                    status: "PAUSED",
                                  },
                                  `ls-p-${l.id}`,
                                  "Listing paused.",
                                )
                              }
                              icon={Pause}
                              label="Pause"
                              tone="gold"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
            <h2 className="mb-4 font-bold">Latest booking activity</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/[0.06] text-xs text-muted">
                    <th className="pb-2 font-medium">Listing</th>
                    <th className="pb-2 font-medium">Traveler</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Value</th>
                    <th className="pb-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentBookings.map((b) => (
                    <tr key={b.id} className="border-b border-black/[0.04]">
                      <td className="py-3 font-medium">{b.title}</td>
                      <td className="py-3 text-muted">{b.travelerName}</td>
                      <td className="py-3 capitalize text-muted">{b.status.toLowerCase()}</td>
                      <td className="py-3 font-semibold text-zim-green">
                        {b.totalPrice > 0 ? formatMoney(b.totalPrice) : "On request"}
                      </td>
                      <td className="py-3 text-muted">{formatDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === "export" && (
        <section className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5">
          <h2 className="mb-2 font-bold">Export centre</h2>
          <p className="mb-4 text-sm text-muted">
            Download datasets for boards, planners, investors, and future modelling.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "Full analytics JSON", href: downloadUrl("full", "json") },
              { label: "Demand–supply gaps CSV", href: downloadUrl("gaps", "csv") },
              { label: "Daily activity CSV", href: downloadUrl("daily", "csv") },
              { label: "Listings by type CSV", href: downloadUrl("listings-by-type", "csv") },
              { label: "Recent bookings CSV", href: downloadUrl("bookings", "csv") },
              { label: "Top listings CSV", href: downloadUrl("top-listings", "csv") },
              { label: "Regional conversion CSV", href: downloadUrl("regions", "csv") },
              { label: "Funnel summary CSV", href: downloadUrl("funnel", "csv") },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-2xl bg-black/[0.03] px-3 py-3 text-sm font-medium transition hover:bg-black/[0.06]"
              >
                {item.label}
                <Download className="h-4 w-4 text-muted" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ListingTable({
  rows,
  empty,
}: {
  rows: AdminAnalytics["topListings"];
  empty: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/[0.06] text-xs text-muted">
            <th className="pb-2 font-medium">Listing</th>
            <th className="pb-2 font-medium">Views</th>
            <th className="pb-2 font-medium">Books</th>
            <th className="pb-2 font-medium">Conv.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-black/[0.04]">
              <td className="py-2.5">
                <p className="font-medium">{r.title}</p>
                <p className="text-[11px] text-muted">
                  {r.region} · {r.type.toLowerCase()}
                </p>
              </td>
              <td className="py-2.5 tabular-nums">{r.views}</td>
              <td className="py-2.5 tabular-nums">{r.bookings}</td>
              <td className="py-2.5 tabular-nums">{r.conversionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionChip({
  onClick,
  busy,
  icon: Icon,
  label,
  tone,
}: {
  onClick: () => void;
  busy: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: "green" | "red" | "gold";
}) {
  const tones = {
    green: "bg-zim-green text-white",
    red: "bg-zim-red text-white",
    gold: "bg-zim-gold text-zim-black",
  };
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50 ${tones[tone]}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
