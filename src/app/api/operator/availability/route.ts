import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  listingId: z.string(),
  date: z.string(),
  capacityRemaining: z.number().int().min(0),
  priceOverride: z.number().positive().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  const operator = await prisma.operatorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!operator) {
    return NextResponse.json({ error: "Operator missing." }, { status: 400 });
  }

  const listing = await prisma.listing.findFirst({
    where: { id: parsed.data.listingId, operatorId: operator.id },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const date = new Date(parsed.data.date);
  const row = await prisma.availability.upsert({
    where: {
      listingId_date: { listingId: listing.id, date },
    },
    create: {
      listingId: listing.id,
      date,
      capacityRemaining: parsed.data.capacityRemaining,
      slotsOpen: parsed.data.capacityRemaining > 0 ? 1 : 0,
      priceOverride: parsed.data.priceOverride,
    },
    update: {
      capacityRemaining: parsed.data.capacityRemaining,
      slotsOpen: parsed.data.capacityRemaining > 0 ? 1 : 0,
      priceOverride: parsed.data.priceOverride,
    },
  });

  return NextResponse.json(row);
}
