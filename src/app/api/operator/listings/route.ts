import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  type: z.enum(["STAY", "ACTIVITY", "GUIDE", "TRANSPORT", "EXPERIENCE"]),
  region: z.string().min(2),
  city: z.string().optional(),
  price: z.number().min(0),
  capacity: z.number().int().positive(),
  included: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const operator = await prisma.operatorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!operator) {
    return NextResponse.json({ error: "Operator profile missing." }, { status: 400 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid listing." }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      operatorId: operator.id,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      region: parsed.data.region,
      city: parsed.data.city,
      price: parsed.data.price,
      capacity: parsed.data.capacity,
      included: parsed.data.included,
      photos: parsed.data.photos || [],
      status: "ACTIVE",
    },
  });

  return NextResponse.json(listing, { status: 201 });
}
