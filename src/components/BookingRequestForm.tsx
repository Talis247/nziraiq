"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function BookingRequestForm({
  listingId,
  price,
  currency,
  signedIn,
}: {
  listingId: string;
  price: number;
  currency: string;
  signedIn: boolean;
}) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState(2);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!signedIn) {
    return (
      <div className="mt-6 space-y-3">
        <p className="text-sm text-muted">Sign in to request a booking.</p>
        <Button href="/login" fullWidth>
          Login to book
        </Button>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, startDate, endDate, guests, notes }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not send request.");
      return;
    }
    setMessage("Booking request sent. The operator will confirm soon.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Start</span>
        <input
          type="date"
          required
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full rounded-2xl border border-border px-3 py-2.5 outline-none ring-zim-green focus:ring-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">End</span>
        <input
          type="date"
          required
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full rounded-2xl border border-border px-3 py-2.5 outline-none ring-zim-green focus:ring-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Guests</span>
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full rounded-2xl border border-border px-3 py-2.5 outline-none ring-zim-green focus:ring-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-2xl border border-border px-3 py-2.5 outline-none ring-zim-green focus:ring-2"
        />
      </label>
      <p className="text-xs text-muted">
        {price > 0
          ? `Est. ${guests} × ${price} ${currency} (final confirmed by operator)`
          : "Rate is on request. The operator confirms the price."}
      </p>
      {error && <p className="text-sm text-zim-red">{error}</p>}
      {message && (
        <p className="text-sm text-zim-green">
          {message}{" "}
          <Link href="/bookings" className="underline">
            View bookings
          </Link>
        </p>
      )}
      <Button type="submit" fullWidth disabled={loading} className="bg-zim-green hover:bg-zim-green-dark">
        {loading ? "Sending…" : "Request booking"}
      </Button>
    </form>
  );
}
