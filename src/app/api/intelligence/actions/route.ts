import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function requireAdmin() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "STAKEHOLDER")
  ) {
    return null;
  }
  return session;
}

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("verify_operator"),
    operatorId: z.string().min(1),
    status: z.enum(["VERIFIED", "REJECTED"]),
  }),
  z.object({
    action: z.literal("set_listing_status"),
    listingId: z.string().min(1),
    status: z.enum(["ACTIVE", "PAUSED", "DRAFT"]),
  }),
  z.object({
    action: z.literal("set_booking_status"),
    bookingId: z.string().min(1),
    status: z.enum(["CONFIRMED", "DECLINED", "CANCELLED", "PAID"]),
  }),
]);

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action payload." }, { status: 400 });
  }

  const body = parsed.data;

  if (body.action === "verify_operator") {
    const updated = await prisma.operatorProfile.update({
      where: { id: body.operatorId },
      data: { verificationStatus: body.status },
    });
    return NextResponse.json({ ok: true, operator: updated });
  }

  if (body.action === "set_listing_status") {
    const updated = await prisma.listing.update({
      where: { id: body.listingId },
      data: { status: body.status },
    });
    return NextResponse.json({ ok: true, listing: updated });
  }

  if (body.action === "set_booking_status") {
    const updated = await prisma.booking.update({
      where: { id: body.bookingId },
      data: { status: body.status },
    });
    return NextResponse.json({ ok: true, booking: updated });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
