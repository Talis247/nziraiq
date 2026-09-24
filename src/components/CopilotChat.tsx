"use client";

import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Send, Sparkles } from "lucide-react";
import { formatMoney } from "@/lib/utils";

type Pick = {
  listingId: string;
  title: string;
  type: string;
  city: string | null;
  region: string;
  price: number;
  included?: string | null;
};

type Message = {
  role: "user" | "assistant";
  text: string;
  reasoning?: string;
  model?: string;
  places?: Pick[];
  activities?: Pick[];
};

const interestChoices = ["Safari", "Boat cruise", "Fishing", "Food", "Culture", "Hiking", "Craft", "Lodge"];
const placeChoices = ["Victoria Falls", "Hwange", "Kariba", "Harare", "Bulawayo", "Nyanga", "Matobo"];
const budgetChoices = [150, 250, 400, 800];

export function CopilotChat({
  signedIn,
  firstName,
}: {
  signedIn: boolean;
  firstName?: string;
}) {
  const [input, setInput] = useState("");
  const [place, setPlace] = useState("");
  const [pickedInterests, setPickedInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [customBudget, setCustomBudget] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [itineraryId, setItineraryId] = useState<string>();
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages, loading]);

  async function send(message: string) {
    if (!message.trim() || loading) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", text: message.trim() }]);
    setLoading(true);

    const res = await fetch("/api/copilot/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim(), save: signedIn }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.error || "Something went wrong. Try again in a moment." },
      ]);
      return;
    }

    setItineraryId(data.itineraryId);
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        text: data.reply,
        reasoning: data.reasoning,
        model: data.model,
        places: data.places || [],
        activities: data.activities || [],
      },
    ]);
  }

  function toggleInterest(interest: string) {
    setPickedInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    );
  }

  function compose() {
    return [
      place ? `I want to go to ${place}` : "",
      pickedInterests.length ? pickedInterests.join(" and ") : "",
      budget ? `budget $${budget}` : "",
      input.trim(),
    ]
      .filter(Boolean)
      .join(", ");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(compose());
  }

  const ready = Boolean(place && pickedInterests.length && budget);
  const hello = firstName ? `Hi ${firstName}, I'm NziraIQ.` : "Hi, I'm NziraIQ.";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-black/[0.06]">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zim-green text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">NziraIQ</p>
          <p className="text-[11px] text-muted">ZimTour Pulse trip chat</p>
        </div>
      </div>

      <div ref={threadRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
        {messages.length === 0 && (
          <div className="mx-auto flex max-w-md flex-col items-center px-2 pt-6 text-center sm:pt-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zim-green/10 text-zim-green">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">{hello}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Tell me where you want to go, tap the interests you like, and set a budget. I will only suggest stays and activities already on ZimTour Pulse, and I will show you why.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <article key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[min(100%,36rem)] text-sm leading-relaxed ${
                message.role === "user"
                  ? "rounded-3xl rounded-br-md bg-zim-black px-4 py-2.5 text-white"
                  : "w-full"
              }`}
            >
              {message.role === "assistant" && (
                <p className="mb-1 text-[11px] font-semibold text-zim-green">NziraIQ</p>
              )}
              <p>{message.text}</p>
              {message.reasoning && (
                <div className="mt-3 rounded-2xl bg-zim-green/[0.06] px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zim-green">
                    Reasoning{message.model ? ` · ${message.model}` : ""}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/80">{message.reasoning}</p>
                </div>
              )}
              {(message.places?.length || message.activities?.length) ? (
                <div className="mt-3 space-y-3">
                  <OptionList heading="Places to stay" items={message.places || []} />
                  <OptionList heading="Activities" items={message.activities || []} />
                  {itineraryId && index === messages.length - 1 && (
                    <Link href={`/trips/${itineraryId}`} className="inline-block text-xs font-semibold text-zim-green">
                      Open saved trip
                    </Link>
                  )}
                </div>
              ) : null}
            </div>
          </article>
        ))}

        {loading && (
          <p className="text-sm text-muted">NziraIQ is looking through the listings…</p>
        )}
      </div>

      <form onSubmit={onSubmit} className="shrink-0 border-t border-border bg-white px-3 py-3">
        <p className="mb-1.5 text-[11px] font-semibold text-muted">Place</p>
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {placeChoices.map((name) => (
            <Chip key={name} on={place === name} onClick={() => setPlace(name)}>
              {name}
            </Chip>
          ))}
        </div>
        <p className="mb-1.5 text-[11px] font-semibold text-muted">Interests</p>
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {interestChoices.map((interest) => (
            <Chip
              key={interest}
              on={pickedInterests.includes(interest)}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Chip>
          ))}
        </div>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {budgetChoices.map((amount) => (
            <Chip
              key={amount}
              on={budget === amount && customBudget === ""}
              onClick={() => {
                setCustomBudget("");
                setBudget(amount);
              }}
            >
              ${amount}
            </Chip>
          ))}
          <label className="flex items-center gap-1 rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-semibold">
            <span>$</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={customBudget}
              onChange={(e) => {
                const next = e.target.value;
                setCustomBudget(next);
                const amount = Number(next);
                setBudget(amount > 0 ? amount : null);
              }}
              placeholder="Your budget"
              className="w-24 bg-transparent outline-none placeholder:font-medium placeholder:text-muted"
            />
          </label>
        </div>
        <div className="flex items-end gap-2 rounded-3xl border border-border bg-black/[0.02] px-3 py-2">
          <textarea
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(compose());
              }
            }}
            placeholder={ready ? "Add a note, or just send" : "Pick a place, interests, and a budget"}
            className="max-h-24 min-h-9 w-full resize-none bg-transparent py-1.5 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={loading || !ready}
            aria-label="Send"
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zim-green text-white disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
        on ? "bg-zim-green text-white" : "bg-black/[0.05] text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function OptionList({ heading, items }: { heading: string; items: Pick[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">{heading}</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <Link
            key={item.listingId}
            href={`/listings/${item.listingId}`}
            className="flex items-center justify-between gap-3 rounded-2xl bg-black/[0.03] px-3 py-2.5"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{item.title}</span>
              <span className="block truncate text-xs capitalize text-muted">
                {(item.included || item.type).replace(/_/g, " ")} · {item.city || item.region}
              </span>
            </span>
            <span className="shrink-0 text-xs font-bold text-zim-green">
              {item.price > 0 ? formatMoney(item.price) : "On request"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
