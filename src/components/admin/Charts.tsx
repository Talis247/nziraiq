"use client";

const palette = ["#1b7a3d", "#c9a227", "#de2010", "#2f6fed", "#6b7280", "#0f766e", "#9333ea"];

export function DonutChart({
  segments,
  size = 160,
  thickness = 22,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={thickness}
          />
          {segments.map((s, i) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color || palette[i % palette.length]}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue && <p className="text-xl font-bold tracking-tight">{centerValue}</p>}
          {centerLabel && <p className="text-[11px] text-muted">{centerLabel}</p>}
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: s.color || palette[i % palette.length] }}
              />
              <span className="truncate capitalize">{s.label.toLowerCase().replaceAll("_", " ")}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarPairChart({
  rows,
}: {
  rows: { label: string; a: number; b: number; badge?: boolean }[];
}) {
  const max = Math.max(...rows.map((r) => Math.max(r.a, r.b)), 1);
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold">
              {r.label}
              {r.badge && (
                <span className="ml-2 rounded-full bg-zim-red/10 px-2 py-0.5 text-[10px] font-bold uppercase text-zim-red">
                  Gap
                </span>
              )}
            </span>
            <span className="text-xs text-muted">
              {r.a} demand · {r.b} supply
            </span>
          </div>
          <div className="space-y-1">
            <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.05]">
              <div
                className="h-full rounded-full bg-zim-green"
                style={{ width: `${Math.max(3, (r.a / max) * 100)}%` }}
              />
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.05]">
              <div
                className="h-full rounded-full bg-zim-gold"
                style={{ width: `${Math.max(3, (r.b / max) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
      <div className="flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-zim-green" /> Demand
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-zim-gold" /> Supply
        </span>
      </div>
    </div>
  );
}

export function FunnelBars({
  steps,
}: {
  steps: { label: string; value: number; rateFromPrev: number | null }[];
}) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={s.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold">{s.label}</span>
            <span className="tabular-nums text-muted">
              {s.value}
              {s.rateFromPrev != null && i > 0 ? (
                <span className="ml-2 text-[11px] font-semibold text-zim-green">
                  {s.rateFromPrev}% from prior
                </span>
              ) : null}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-black/[0.05]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-zim-green to-zim-gold"
              style={{ width: `${Math.max(4, (s.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AreaTrendChart({
  points,
  series,
}: {
  points: { date: string; searches: number; bookings: number; views: number }[];
  series?: Array<"searches" | "bookings" | "views">;
}) {
  const keys = series || ["searches", "bookings", "views"];
  const width = 560;
  const height = 180;
  const pad = { t: 12, r: 12, b: 24, l: 8 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const max = Math.max(...points.flatMap((p) => keys.map((k) => p[k])), 1);

  function pathFor(key: "searches" | "bookings" | "views") {
    return points
      .map((p, i) => {
        const x = pad.l + (i / Math.max(points.length - 1, 1)) * innerW;
        const y = pad.t + innerH - (p[key] / max) * innerH;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }

  const colors: Record<string, string> = {
    searches: "#1b7a3d",
    bookings: "#c9a227",
    views: "#2f6fed",
  };

  const last = points[points.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img">
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={pad.l}
            x2={width - pad.r}
            y1={pad.t + innerH * (1 - t)}
            y2={pad.t + innerH * (1 - t)}
            stroke="rgba(0,0,0,0.06)"
          />
        ))}
        {keys.map((k) => (
          <path key={k} d={pathFor(k)} fill="none" stroke={colors[k]} strokeWidth="2.5" />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
        {keys.map((k) => (
          <span key={k} className="flex items-center gap-1.5 capitalize">
            <span className="h-2 w-2 rounded-full" style={{ background: colors[k] }} />
            {k}
            {last ? ` · ${last[k]}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
