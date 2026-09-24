import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  listingId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  guests: z.number().int().min(1),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "OPERATOR") {
    const operator = await prisma.operatorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!operator) return NextResponse.json([]);
    const bookings = await prisma.booking.findMany({
      where: { listing: { operatorId: operator.id } },
      include: { listing: true, traveler: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(bookings);
  }

  const bookings = await prisma.booking.findMany({
    where: { travelerId: session.user.id },
    include: { listing: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking." }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
  });
  if (!listing || listing.status !== "ACTIVE") {
    return NextResponse.json({ error: "Listing not available." }, { status: 404 });
  }

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  if (end < start) {
    return NextResponse.json({ error: "End date must be after start." }, { status: 400 });
  }

  const nights = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const totalPrice = listing.price * parsed.data.guests * (listing.type === "STAY" ? nights : 1);

  const booking = await prisma.booking.create({
    data: {
      travelerId: session.user.id,
      listingId: listing.id,
      startDate: start,
      endDate: end,
      guests: parsed.data.guests,
      totalPrice,
      currency: listing.currency,
      notes: parsed.data.notes,
      status: "REQUESTED",
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
