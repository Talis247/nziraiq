import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { runCopilot } from "@/lib/copilot";
import { prisma } from "@/lib/db";

const schema = z.object({
  message: z.string().min(2),
  save: z.boolean().optional(),
  region: z.string().optional(),
  budget: z.number().optional(),
  interests: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Message required." }, { status: 400 });
  }

  const result = await runCopilot({
    message: parsed.data.message,
    userId: session?.user?.id,
    region: parsed.data.region,
    budget: parsed.data.budget,
    interests: parsed.data.interests,
  });

  let itineraryId: string | undefined;
  if (parsed.data.save && session?.user) {
    const itinerary = await prisma.itinerary.create({
      data: {
        travelerId: session.user.id,
        title: result.title,
        budget: parsed.data.budget,
        totalEstimate: result.totalEstimate,
        currency: result.currency,
        stops: {
          create: result.stops.map((s) => ({
            dayIndex: s.dayIndex,
            order: s.order,
            placeName: s.placeName,
            timing: s.timing,
            estimatedCost: s.estimatedCost,
            reason: s.reason,
            listingId: s.listingId,
            bookable: s.bookable,
          })),
        },
      },
    });
    itineraryId = itinerary.id;
  }

  return NextResponse.json({ ...result, itineraryId });
}
