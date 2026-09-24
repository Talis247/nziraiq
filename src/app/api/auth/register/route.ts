import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["TRAVELER", "OPERATOR"]),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  operatorType: z
    .enum(["LODGE", "GUESTHOUSE", "GUIDE", "TRANSPORT", "ACTIVITY", "COMMUNITY"])
    .optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid details." }, { status: 400 });
    }

    const { name, email, password, role, businessName, phone, operatorType } = parsed.data;
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    if (role === "OPERATOR" && !businessName) {
      return NextResponse.json({ error: "Business name required." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        travelerProfile:
          role === "TRAVELER"
            ? { create: { interests: [], groupSize: 1 } }
            : undefined,
        operatorProfile:
          role === "OPERATOR"
            ? {
                create: {
                  businessName: businessName!,
                  type: operatorType || "ACTIVITY",
                  phone: phone || undefined,
                },
              }
            : undefined,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
