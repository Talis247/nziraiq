import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Deterministic for SSR — numeric only, Africa/Harare wall clock. */
export function formatDateTime(value: string | Date) {
  const parts = zimParts(value);
  return `${parts.day}/${parts.month}/${parts.year}, ${parts.hour}:${parts.minute}`;
}

export function formatDate(value: string | Date) {
  const parts = zimParts(value);
  return `${parts.day}/${parts.month}/${parts.year}`;
}

function zimParts(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Harare",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  return {
    day: map.day || "01",
    month: map.month || "01",
    year: map.year || "1970",
    hour: map.hour || "00",
    minute: map.minute || "00",
  };
}

export function priceLabel(amount: number, currency = "USD") {
  if (!amount || amount <= 0) return "Price on request";
  return formatMoney(amount, currency);
}

export function budgetBand(budget?: number | null) {
  if (budget == null) return "unknown";
  if (budget < 150) return "under_150";
  if (budget < 400) return "150_400";
  if (budget < 800) return "400_800";
  return "800_plus";
}
