import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No photos selected." }, { status: 400 });
  }
  if (files.length > 6) {
    return NextResponse.json({ error: "Upload up to 6 photos." }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads", "listings", session.user.id);
  await mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "Use JPG, PNG, WEBP, or GIF." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Each photo must be under 4MB." }, { status: 400 });
    }
    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buffer);
    urls.push(`/uploads/listings/${session.user.id}/${name}`);
  }

  return NextResponse.json({ urls });
}
