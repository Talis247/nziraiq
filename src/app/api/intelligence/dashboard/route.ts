import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminAnalytics } from "@/lib/intelligence/admin-analytics";

export async function GET(req: Request) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "STAKEHOLDER" && session.user.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const refresh = searchParams.get("refresh") === "1";
  const data = await getAdminAnalytics({ refresh });
  return NextResponse.json(data);
}
