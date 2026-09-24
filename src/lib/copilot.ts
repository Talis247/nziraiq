import { prisma } from "@/lib/db";
import { budgetBand } from "@/lib/utils";
import { anchorWhere, aroundWhere, findCluster } from "@/lib/clusters";
import OpenAI from "openai";

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

export type CopilotItinerary = {
  title: string;
  totalEstimate: number;
  currency: string;
  stops: CopilotStop[];
  reply: string;
};

async function searchListings(opts: {
  region?: string;
  interests?: string[];
  budget?: number;
}) {
  const cluster = findCluster(opts.region);
  const placeFilter = cluster
    ? anchorWhere(cluster)
    : opts.region
      ? {
          OR: [
            { region: { contains: opts.region, mode: "insensitive" as const } },
            { city: { contains: opts.region, mode: "insensitive" as const } },
            { title: { contains: opts.region, mode: "insensitive" as const } },
          ],
        }
      : {};

  const [anchor, around] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE", AND: [placeFilter] },
      orderBy: [{ ratingAvg: "desc" }, { title: "asc" }],
      take: 16,
    }),
    cluster
      ? prisma.listing.findMany({
          where: { status: "ACTIVE", AND: [aroundWhere(cluster)] },
          orderBy: [{ title: "asc" }],
          take: 12,
        })
      : Promise.resolve([]),
  ]);

  const rank = <T extends { title: string; description: string; type: string; region: string; ratingAvg: number }>(
    listings: T[],
  ) => {
    if (!opts.interests?.length) return listings;
    const terms = opts.interests.map((i) => i.toLowerCase());
    return [...listings].sort((a, b) => {
      const score = (item: T) => {
        const hay = `${item.title} ${item.description} ${item.type} ${item.region}`.toLowerCase();
        return terms.reduce((s, t) => s + (hay.includes(t) ? 2 : 0), 0);
      };
      return score(b) - score(a) || b.ratingAvg - a.ratingAvg;
    });
  };

  return { anchor: rank(anchor), around: rank(around), cluster };
}

function buildRuleBasedItinerary(
  message: string,
  plan: Awaited<ReturnType<typeof searchListings>>,
): CopilotItinerary {
  const daysMatch = message.match(/(\d+)\s*day/i);
  const budgetMatch = message.match(/\$?\s*(\d{2,5})/);
  const days = Math.min(Math.max(daysMatch ? Number(daysMatch[1]) : 3, 1), 7);
  const budget = budgetMatch ? Number(budgetMatch[1]) : 300;

  const stops: CopilotStop[] = [];
  let total = 0;

  for (let day = 1; day <= days; day++) {
    const morning = plan.anchor[day - 1];
    const afternoon = plan.around[day - 1] || plan.anchor[day];

    if (morning) {
      stops.push({
        dayIndex: day,
        order: 1,
        placeName: morning.title,
        timing: "Morning",
        estimatedCost: morning.price > 0 ? morning.price : undefined,
        reason: morning.price > 0
          ? `Registered facility in ${morning.city || morning.region}.`
          : `Registered facility in ${morning.city || morning.region}. Rate is on request.`,
        listingId: morning.id,
        bookable: true,
      });
      total += morning.price > 0 ? morning.price : 0;
    }
    if (afternoon && afternoon.id !== morning?.id) {
      stops.push({
        dayIndex: day,
        order: 2,
        placeName: afternoon.title,
        timing: "Afternoon",
        estimatedCost: afternoon.price > 0 ? afternoon.price : undefined,
        reason: plan.around[day - 1]
          ? `Nearby ${afternoon.city || afternoon.region} stop, including smaller resorts and local businesses around ${plan.cluster?.label || "the main place"}.`
          : `Another registered option around ${afternoon.city || afternoon.region}.`,
        listingId: afternoon.id,
        bookable: true,
      });
      total += afternoon.price > 0 ? afternoon.price : 0;
    }
  }

  if (stops.length === 0) {
    return {
      title: "Zimbabwe discovery outline",
      totalEstimate: 0,
      currency: "USD",
      stops: [],
      reply:
        "I couldn't find matching listings yet. Try a broader region (Harare, Victoria Falls, Eastern Highlands) or ask an operator to list nearby.",
    };
  }

  const over = total > budget;
  return {
    title: `${days}-day Zimbabwe itinerary`,
    totalEstimate: total,
    currency: "USD",
    stops,
    reply:
      total > 0
        ? over
          ? `Here's a ${days}-day plan from registered Zimbabwe facilities. Estimated ~$${Math.round(total)} is above about $${budget}. Say "cheaper" to refine.`
          : `Here's a ${days}-day plan from registered Zimbabwe facilities. Estimated ~$${Math.round(total)}. Unpriced stops are on request.`
        : `Here's a ${days}-day plan from the national tourism register. These facilities don't publish rates in the register, so prices are on request.`,
  };
}

export async function runCopilot(opts: {
  message: string;
  userId?: string;
  region?: string;
  budget?: number;
  interests?: string[];
}) {
  const interests =
    opts.interests?.length
      ? opts.interests
      : extractInterests(opts.message);

  const region = opts.region || extractRegion(opts.message);
  const budget =
    opts.budget ||
    Number(opts.message.match(/\$?\s*(\d{2,5})/)?.[1] || 0) ||
    undefined;

  await prisma.searchEvent.create({
    data: {
      userId: opts.userId,
      query: opts.message.slice(0, 500),
      interests,
      region: region || undefined,
      budgetBand: budgetBand(budget),
      source: "copilot",
    },
  });

  const plan = await searchListings({ region, interests, budget });
  const catalog = [
    ...plan.anchor.map((l) => ({ ...l, nearby: false })),
    ...plan.around.map((l) => ({ ...l, nearby: true })),
  ].map((l) => ({
    id: l.id,
    title: l.title,
    type: l.type,
    region: l.region,
    city: l.city,
    price: l.price,
    currency: l.currency,
    capacity: l.capacity,
    ratingAvg: l.ratingAvg,
    nearby: l.nearby,
  }));

  if (!process.env.OPENAI_API_KEY) {
    return buildRuleBasedItinerary(opts.message, plan);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are NziraIQ Copilot for Zimbabwe tourism. Only recommend from the provided listings catalog. Never invent prices, availability, or listing IDs. Return JSON: { "reply": string, "title": string, "totalEstimate": number, "currency": "USD", "stops": [{ "dayIndex": number, "order": number, "placeName": string, "timing": string, "estimatedCost": number, "reason": string, "listingId": string|null, "bookable": boolean }] }. If listingId is set it must exist in catalog and bookable true. Each day should include the main place and, when nearby listings exist, one nearby or small-business stop (craft, curio, community, or a town on the way).`,
        },
        {
          role: "user",
          content: JSON.stringify({
            message: opts.message,
            region,
            budget,
            interests,
            catalog,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw) as CopilotItinerary;
    const validIds = new Set(catalog.map((c) => c.id));

    parsed.stops = (parsed.stops || []).map((s) => {
      if (s.listingId && !validIds.has(s.listingId)) {
        return { ...s, listingId: undefined, bookable: false, estimatedCost: undefined };
      }
      if (s.listingId) {
        const item = catalog.find((c) => c.id === s.listingId)!;
        return {
          ...s,
          placeName: item.title,
          estimatedCost: item.price > 0 ? item.price : undefined,
          bookable: true,
        };
      }
      return { ...s, bookable: false };
    });

    parsed.totalEstimate = parsed.stops.reduce(
      (sum, s) => sum + (s.estimatedCost || 0),
      0,
    );
    parsed.currency = parsed.currency || "USD";
    parsed.reply =
      parsed.reply ||
      "Here's an itinerary built only from verified NziraIQ listings.";
    return parsed;
  } catch {
    return buildRuleBasedItinerary(opts.message, plan);
  }
}

function extractInterests(message: string) {
  const catalog = [
    "nature",
    "adventure",
    "culture",
    "wildlife",
    "family",
    "food",
    "history",
    "hiking",
    "waterfall",
    "community",
  ];
  const lower = message.toLowerCase();
  return catalog.filter((c) => lower.includes(c));
}

function extractRegion(message: string) {
  const regions = [
    "Harare",
    "Victoria Falls",
    "Bulawayo",
    "Eastern Highlands",
    "Manicaland",
    "Matobo",
    "Matabeleland",
    "Hwange",
    "Kariba",
    "Great Zimbabwe",
    "Masvingo",
    "Mutare",
    "Nyanga",
  ];
  const lower = message.toLowerCase();
  return regions.find((r) => lower.includes(r.toLowerCase()));
}
