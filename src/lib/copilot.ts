import { prisma } from "@/lib/db";
import { budgetBand } from "@/lib/utils";
import { anchorWhere, aroundWhere, clusters, findCluster } from "@/lib/clusters";
import type { Listing, ListingType } from "@prisma/client";

export type CopilotStop = {
  dayIndex: number;
  order: number;
  placeName: string;
  timing?: string;
  estimatedCost?: number;
  reason?: string;
  listingId?: string;
  bookable: boolean;
};

export type CopilotPick = {
  listingId: string;
  title: string;
  type: string;
  city: string | null;
  region: string;
  price: number;
  included?: string | null;
  reason: string;
};

export type CopilotItinerary = {
  title: string;
  totalEstimate: number;
  currency: string;
  stops: CopilotStop[];
  places: CopilotPick[];
  activities: CopilotPick[];
  reply: string;
  reasoning?: string;
  model?: string;
  brief?: {
    destination?: string;
    activities: string[];
    budget?: number;
  };
};

const activityHints: { words: string[]; terms: string[]; types: ListingType[] }[] = [
  {
    words: ["safari", "wildlife", "game drive", "animals", "elephant"],
    terms: ["safari", "game", "wildlife", "tour", "park"],
    types: ["ACTIVITY", "GUIDE"],
  },
  {
    words: ["hike", "hiking", "walk", "trail", "trek"],
    terms: ["hike", "walk", "trail", "tour", "nature"],
    types: ["ACTIVITY", "GUIDE"],
  },
  {
    words: ["boat", "cruise", "canoe", "fishing", "sundowner"],
    terms: ["boat", "cruise", "canoe", "fish", "lake"],
    types: ["ACTIVITY", "EXPERIENCE"],
  },
  {
    words: ["food", "eat", "restaurant", "dinner", "lunch", "cuisine"],
    terms: ["restaurant", "food", "dining"],
    types: ["EXPERIENCE"],
  },
  {
    words: ["culture", "history", "museum", "ruins", "heritage"],
    terms: ["museum", "culture", "heritage", "ruin", "attraction"],
    types: ["EXPERIENCE", "ACTIVITY"],
  },
  {
    words: ["craft", "curio", "market", "shopping", "souvenir"],
    terms: ["curio", "craft", "market"],
    types: ["EXPERIENCE"],
  },
  {
    words: ["guide", "tour operator", "tour"],
    terms: ["tour", "guide", "operator"],
    types: ["GUIDE", "ACTIVITY"],
  },
  {
    words: ["transfer", "transport", "car hire", "driver", "shuttle"],
    terms: ["vehicle", "hire", "transfer", "transport"],
    types: ["TRANSPORT"],
  },
  {
    words: ["stay", "lodge", "hotel", "sleep", "accommodation", "guesthouse", "camp"],
    terms: ["hotel", "lodge", "guest", "camp", "inn"],
    types: ["STAY"],
  },
];

const placeNames = Array.from(
  new Set(
    clusters.flatMap((c) => [c.label, c.key, ...c.anchor, ...c.nearby, ...c.spots.map((s) => s.name)]),
  ),
).sort((a, b) => b.length - a.length);

function parseBudget(message: string) {
  const labeled = message.match(
    /(?:budget|spend|under|around|about|max(?:imum)?)\s*(?:of|is|:)?\s*\$?\s*(\d{2,5})/i,
  );
  if (labeled) return Number(labeled[1]);
  const dollar = message.match(/\$\s*(\d{2,5})/);
  if (dollar) return Number(dollar[1]);
  const usd = message.match(/(\d{2,5})\s*(?:usd|dollars)/i);
  if (usd) return Number(usd[1]);
  return undefined;
}

function parseDestination(message: string) {
  const lower = message.toLowerCase();
  const named = placeNames.find((name) => lower.includes(name.toLowerCase()));
  if (named) return named;
  const phrase = message.match(
    /\b(?:go to|going to|visit|visiting|trip to|travel to|in|around|near)\s+([a-z][a-z\s'-]{2,40})/i,
  );
  const guess = phrase?.[1]?.replace(/\b(and|with|for|on|my|a|the)\b.*$/i, "").trim();
  if (!guess) return undefined;
  return findCluster(guess)?.label || guess;
}

function parseActivities(message: string) {
  const lower = message.toLowerCase();
  return activityHints.filter((hint) => hint.words.some((word) => lower.includes(word)));
}

function toPick(listing: Listing, reason: string): CopilotPick {
  return {
    listingId: listing.id,
    title: listing.title,
    type: listing.type,
    city: listing.city,
    region: listing.region,
    price: listing.price,
    included: listing.included,
    reason,
  };
}

function scoreListing(listing: Listing, hints: typeof activityHints) {
  if (!hints.length) return listing.type === "STAY" ? 1 : 2;
  const hay = `${listing.title} ${listing.description} ${listing.included || ""} ${listing.type}`.toLowerCase();
  return hints.reduce((score, hint) => {
    const termHit = hint.terms.reduce((n, term) => n + (hay.includes(term) ? 2 : 0), 0);
    const typeHit = termHit > 0 && hint.types.includes(listing.type) ? 2 : 0;
    return score + typeHit + termHit;
  }, 0);
}

async function matchPlatform(opts: {
  destination?: string;
  hints: typeof activityHints;
  budget?: number;
}) {
  const cluster = findCluster(opts.destination);
  const placeFilter = cluster
    ? { OR: [anchorWhere(cluster), aroundWhere(cluster)] }
    : opts.destination
      ? {
          OR: [
            { region: { contains: opts.destination, mode: "insensitive" as const } },
            { city: { contains: opts.destination, mode: "insensitive" as const } },
            { title: { contains: opts.destination, mode: "insensitive" as const } },
            { address: { contains: opts.destination, mode: "insensitive" as const } },
          ],
        }
      : {};

  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      AND: [
        placeFilter,
        opts.budget != null ? { OR: [{ price: { lte: opts.budget } }, { price: { lte: 0 } }] } : {},
      ],
    },
    orderBy: [{ ratingAvg: "desc" }, { title: "asc" }],
    take: 40,
  });

  const destination = (opts.destination || "").toLowerCase();
  const ranked = [...listings].sort((a, b) => {
    const near = (item: Listing) =>
      destination && `${item.city || ""} ${item.title}`.toLowerCase().includes(destination) ? 4 : 0;
    return (
      scoreListing(b, opts.hints) + near(b) - (scoreListing(a, opts.hints) + near(a)) ||
      a.title.localeCompare(b.title)
    );
  });
  const activityOnly = opts.hints.filter((hint) => hint.types.some((type) => type !== "STAY"));
  const stays = ranked.filter((item) => item.type === "STAY").slice(0, 6);
  const things = activityOnly.length
    ? ranked
        .filter((item) => item.type !== "STAY" && scoreListing(item, activityOnly) > 0)
        .slice(0, 8)
    : [];
  const where = cluster?.label || opts.destination || "Zimbabwe";

  return {
    places: stays.map((item) =>
      toPick(
        item,
        item.price > 0
          ? `Stay in ${item.city || item.region} within the budget.`
          : `Stay in ${item.city || item.region}. The register has no public rate, so the operator confirms the price.`,
      ),
    ),
    activities: things.map((item) =>
      toPick(
        item,
        `${(item.included || item.type).replace(/_/g, " ")} on the platform around ${where}.`,
      ),
    ),
  };
}

function buildPlan(
  message: string,
  matches: { places: CopilotPick[]; activities: CopilotPick[] },
  destination?: string,
  budget?: number,
  activityLabels: string[] = [],
): CopilotItinerary {
  const picks = [...matches.places, ...matches.activities];
  if (!destination || budget == null || activityLabels.length === 0) {
    const missing = [
      !destination ? "where you want to go" : null,
      activityLabels.length === 0 ? "the activities you want" : null,
      budget == null ? "your budget in USD" : null,
    ].filter(Boolean);
    return {
      title: "Trip brief",
      totalEstimate: 0,
      currency: "USD",
      stops: [],
      places: [],
      activities: [],
      brief: { destination, activities: activityLabels, budget },
      reply: `Tell me ${missing.join(", ")}. For example: "I want to go to Victoria Falls, do a safari and a boat cruise, budget $400." I will only show places and activities already on ZimTour Pulse.`,
    };
  }

  if (picks.length === 0) {
    return {
      title: `${destination} options`,
      totalEstimate: 0,
      currency: "USD",
      stops: [],
      places: [],
      activities: [],
      reply: `Nothing on the platform matches ${destination} for ${activityLabels.join(", ")} within $${budget}. Try a nearby town or a wider activity such as tours or stays.`,
    };
  }

  const priced = picks.filter((item) => item.price > 0);
  const total = priced.reduce((sum, item) => sum + item.price, 0);
  const stops: CopilotStop[] = picks.slice(0, 6).map((item, index) => ({
    dayIndex: Math.floor(index / 2) + 1,
    order: (index % 2) + 1,
    placeName: item.title,
    timing: item.type === "STAY" ? "Stay" : "Activity",
    estimatedCost: item.price > 0 ? item.price : undefined,
    reason: item.reason,
    listingId: item.listingId,
    bookable: true,
  }));

  const placeLine = matches.places.length
    ? `${matches.places.length} place${matches.places.length === 1 ? "" : "s"} to stay`
    : "no listed stays";
  const activityLine = matches.activities.length
    ? `${matches.activities.length} activit${matches.activities.length === 1 ? "y" : "ies"}`
    : "no listed activities";

  return {
    title: `${destination} within $${budget}`,
    brief: { destination, activities: activityLabels, budget },
    totalEstimate: total,
    currency: "USD",
    stops,
    places: matches.places,
    activities: matches.activities,
    reply: `For ${destination}, ${activityLabels.join(", ")}, and a $${budget} budget, ZimTour Pulse has ${placeLine} and ${activityLine}. Priced options add up to about $${Math.round(total) || 0}. Anything marked on request is in the national register without a public rate, so it stays inside your search until the operator confirms.`,
  };
}

export async function runCopilot(opts: {
  message: string;
  userId?: string;
  region?: string;
  budget?: number;
  interests?: string[];
}) {
  const destination = opts.region || parseDestination(opts.message);
  const hints = parseActivities(
    [opts.message, ...(opts.interests || [])].join(" "),
  );
  const budget = opts.budget || parseBudget(opts.message);
  const activityLabels = hints.map((hint) => hint.words[0]);

  await prisma.searchEvent.create({
    data: {
      userId: opts.userId,
      query: opts.message.slice(0, 500),
      interests: activityLabels,
      region: destination || undefined,
      budgetBand: budgetBand(budget),
      source: "copilot",
    },
  });

  if (!destination || budget == null || hints.length === 0) {
    return buildPlan(opts.message, { places: [], activities: [] }, destination, budget, activityLabels);
  }

  const matches = await matchPlatform({ destination, hints, budget });
  const plan = buildPlan(opts.message, matches, destination, budget, activityLabels);
  const localReasoning = `You want ${destination}, with ${activityLabels.join(", ")}, on about $${budget}. I only kept stays and activities that are already listed on ZimTour Pulse.`;
  const reasoned = await reasonWithOpenModel(plan);
  return {
    ...plan,
    reply: reasoned?.reply || plan.reply,
    reasoning: reasoned?.reasoning || localReasoning,
    model: reasoned?.model || "ZimTour Pulse",
  };
}

async function reasonWithOpenModel(plan: CopilotItinerary) {
  const picks = [...plan.places, ...plan.activities];
  if (!picks.length) return null;

  const catalog = picks.map((item) => ({
    title: item.title,
    kind: item.type === "STAY" ? "stay" : "activity",
    where: item.city || item.region,
    price: item.price > 0 ? item.price : "on request",
    category: item.included || item.type,
  }));

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const groq = await completeChat({
      url: "https://api.groq.com/openai/v1/chat/completions",
      model: "llama-3.3-70b-versatile",
      label: "Llama 3.3",
      apiKey: groqKey,
      catalog,
      plan,
    });
    if (groq) return groq;
  }

  return completeChat({
    url: "https://text.pollinations.ai/openai",
    model: "gpt-oss",
    label: "GPT-OSS",
    catalog,
    plan,
  });
}

async function completeChat(opts: {
  url: string;
  model: string;
  label: string;
  apiKey?: string;
  catalog: unknown;
  plan: CopilotItinerary;
}) {
  try {
    const res = await fetch(opts.url, {
      method: "POST",
      signal: AbortSignal.timeout(4000),
      headers: {
        "Content-Type": "application/json",
        ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: opts.model,
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              "You plan Zimbabwe trips for ZimTour Pulse. Use only the listings JSON. Do not invent places, prices, or activities. Reply with JSON only: {\"reply\":\"2 short sentences for the traveler\",\"reasoning\":\"2 sentences on why these listings fit the destination, activities, and budget\"}.",
          },
          {
            role: "user",
            content: JSON.stringify({
              destination: opts.plan.brief?.destination,
              activities: opts.plan.brief?.activities,
              budgetUsd: opts.plan.brief?.budget,
              listings: opts.catalog,
            }),
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content || "";
    const json = content.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return null;
    const parsed = JSON.parse(json) as { reply?: string; reasoning?: string };
    if (!parsed.reply) return null;
    return {
      reply: parsed.reply,
      reasoning: parsed.reasoning,
      model: opts.label,
    };
  } catch {
    return null;
  }
}
