"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const field =
  "w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none ring-zim-green focus:ring-2";

export function AvailabilityForm({
  listingId,
  capacity,
}: {
  listingId: string;
  capacity: number;
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState(capacity);
  const [priceOverride, setPriceOverride] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/operator/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        date,
        capacityRemaining: slots,
        priceOverride: priceOverride ? Number(priceOverride) : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not save.");
      return;
    }
    setDate("");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:p-5"
    >
      <h2 className="font-bold">Add or update a date</h2>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Date</span>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={field}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Spaces left</span>
        <input
          type="number"
          min={0}
          required
          value={slots}
          onChange={(e) => setSlots(Number(e.target.value))}
          className={field}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Price override (optional)</span>
        <input
          type="number"
          min={0}
          placeholder="USD"
          value={priceOverride}
          onChange={(e) => setPriceOverride(e.target.value)}
          className={field}
        />
      </label>
      {error && <p className="text-sm text-zim-red">{error}</p>}
      <Button type="submit" fullWidth disabled={loading}>
        {loading ? "Saving…" : "Save availability"}
      </Button>
    </form>
  );
}
