import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  status: z.enum(["CONFIRMED", "DECLINED", "CANCELLED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: { include: { operator: true } } },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const isOperator = booking.listing.operator.userId === session.user.id;
  const isTraveler = booking.travelerId === session.user.id;

  if (parsed.data.status === "CANCELLED" && !isTraveler && !isOperator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (
    (parsed.data.status === "CONFIRMED" || parsed.data.status === "DECLINED") &&
    !isOperator
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}
