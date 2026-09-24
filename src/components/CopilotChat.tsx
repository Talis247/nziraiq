"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils";

type Stop = {
  dayIndex: number;
  order: number;
  placeName: string;
  timing?: string;
  estimatedCost?: number;
  reason?: string;
  listingId?: string;
  bookable: boolean;
};

type Message = { role: "user" | "assistant"; text: string };

export function CopilotChat({ signedIn }: { signedIn: boolean }) {
  const [input, setInput] = useState(
    "3 days, $300, I love nature, starting from Harare",
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi — I'm your NziraIQ Copilot. Tell me your budget, interests, group size and starting city. I'll build a day-by-day plan from real listings only.",
    },
  ]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState(0);
  const [itineraryId, setItineraryId] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const message = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setLoading(true);

    const res = await fetch("/api/copilot/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, save: signedIn }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.error || "Something went wrong." },
      ]);
      return;
    }

    setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    setStops(data.stops || []);
    setTitle(data.title || "");
    setTotal(data.totalEstimate || 0);
    setItineraryId(data.itineraryId);
  }

  const days = Array.from(new Set(stops.map((s) => s.dayIndex))).sort(
    (a, b) => a - b,
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-5">
      <div className="flex h-[min(70dvh,640px)] min-h-[420px] flex-col overflow-hidden rounded-3xl border border-border bg-white lg:col-span-3">
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zim-green/10 text-zim-green">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">AI Copilot</p>
            <p className="truncate text-xs text-muted">Plans from real marketplace listings</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[90%] break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-zim-black text-white"
                  : "bg-zim-white text-foreground"
              }`}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="rounded-2xl bg-zim-white px-4 py-3 text-sm text-muted">
              Building your itinerary…
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="flex shrink-0 gap-2 border-t border-border p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='e.g. "3 days, $300, nature, from Harare"'
            className="min-w-0 flex-1 rounded-full border border-border px-4 py-3 text-sm outline-none ring-zim-green focus:ring-2"
          />
          <Button type="submit" disabled={loading} className="!shrink-0 !px-4" aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="max-h-[min(70dvh,640px)] overflow-y-auto overscroll-contain rounded-3xl border border-border bg-white p-5 lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zim-gold">
          Itinerary
        </p>
        <h2 className="mt-1 break-words text-xl font-bold">
          {title || "Your plan appears here"}
        </h2>
        {total > 0 && (
          <p className="mt-1 text-sm font-semibold text-zim-green">
            Est. {formatMoney(total)}
          </p>
        )}
        {itineraryId && (
          <Link
            href={`/trips/${itineraryId}`}
            className="mt-2 inline-block text-sm font-medium text-zim-green underline"
          >
            Open saved trip
          </Link>
        )}

        <div className="mt-5 space-y-5">
          {days.length === 0 && (
            <p className="text-sm text-muted">
              Chat with the Copilot to generate a day-by-day plan with bookable stops.
            </p>
          )}
          {days.map((day) => (
            <div key={day}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zim-green">
                Day {day}
              </p>
              <div className="space-y-2">
                {stops
                  .filter((s) => s.dayIndex === day)
                  .map((s, idx) => (
                    <div
                      key={`${day}-${idx}`}
                      className="rounded-2xl border border-border/80 bg-zim-white/80 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{s.placeName}</p>
                          <p className="text-xs text-muted">{s.timing}</p>
                        </div>
                        {s.estimatedCost != null && (
                          <p className="text-sm font-bold text-zim-green">
                            {formatMoney(s.estimatedCost)}
                          </p>
                        )}
                      </div>
                      {s.reason && (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted">
                          {s.reason}
                        </p>
                      )}
                      {s.bookable && s.listingId && (
                        <Link
                          href={`/listings/${s.listingId}`}
                          className="mt-2 inline-block text-xs font-semibold text-zim-green"
                        >
                          View & book →
                        </Link>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
