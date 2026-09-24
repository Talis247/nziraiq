import { PrismaClient, ListingType, OperatorType } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import path from "path";

const prisma = new PrismaClient();

const FILE = path.resolve(
  __dirname,
  "../../TOURISM FACILITIES DATABASE_ (006).xlsx",
);

const PHOTOS: Record<ListingType, string> = {
  STAY: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  ACTIVITY:
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
  GUIDE:
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
  TRANSPORT:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  EXPERIENCE:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
};

function listingType(category: string): ListingType {
  const c = category.toUpperCase();
  if (
    /BED AND BREAKFAST|GUEST HOUSE|HOSTEL|HOTEL|INN|LODGE|MOTEL|SELF CATERING|FARM HOUSE|CAMP|CARAVAN|HOUSE BOAT/.test(
      c,
    )
  ) {
    return "STAY";
  }
  if (/AIR|MOTOR VEHICLE|VEHICLE HIRE/.test(c)) return "TRANSPORT";
  if (/TOUR OPERATOR|TRAVEL AGENC|EXTERNAL TOUR/.test(c)) return "GUIDE";
  if (/RESTAURANT|CURIO|ATTRACTION/.test(c)) return "EXPERIENCE";
  return "ACTIVITY";
}

function provinceName(raw: string) {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const map: Record<string, string> = {
    harare: "Harare",
    "mat north": "Matabeleland North",
    bulawayo: "Bulawayo",
    buloawayo: "Bulawayo",
    manicaland: "Manicaland",
    "mash east": "Mashonaland East",
    "mas east": "Mashonaland East",
    "mash west": "Mashonaland West",
    "mat south": "Matabeleland South",
    masvingo: "Masvingo",
    "mash central": "Mashonaland Central",
    midlands: "Midlands",
    chinhoyi: "Mashonaland West",
  };
  return map[key] || raw.trim() || "Zimbabwe";
}

function cleanGrade(raw: string) {
  const g = raw.trim().replace(/\s+/g, " ");
  if (!g || g.length < 3) return null;
  return g.slice(0, 80);
}

async function main() {
  const wb = XLSX.readFile(FILE);
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets[wb.SheetNames[0]], {
    header: 1,
    defval: "",
  });

  let category = "VISITOR ACTIVITY";
  const seen = new Set<string>();
  const facilities: {
    externalCode: string;
    title: string;
    description: string;
    type: ListingType;
    region: string;
    city: string | null;
    address: string | null;
    included: string;
    grade: string | null;
    phone: string | null;
  }[] = [];

  for (const row of rows.slice(2)) {
    const code = String(row[0] ?? "").trim();
    const province = String(row[1] ?? "").trim();
    const area = String(row[2] ?? "").trim();
    const name = String(row[3] ?? "").trim();
    const address = String(row[4] ?? "").trim();
    const email = String(row[5] ?? "").trim();
    const tel = String(row[6] ?? "").trim();
    const grade = cleanGrade(String(row[7] ?? ""));

    if (!name) {
      if (code) category = code;
      continue;
    }

    let externalCode = code || `REG-${facilities.length + 1}`;
    if (seen.has(externalCode)) externalCode = `${externalCode}-${facilities.length}`;
    seen.add(externalCode);

    const region = provinceName(province || area);
    const city = area || null;
    const bits = [
      `${name} is a registered ${category.toLowerCase()} in ${[city, region].filter(Boolean).join(", ")}.`,
      grade ? `Official grade: ${grade}.` : null,
      address ? `Address: ${address}.` : null,
      tel ? `Phone: ${tel}.` : null,
      email ? `Email: ${email}.` : null,
      "Rates are not published in the national register — request a booking and the operator confirms the price.",
    ].filter(Boolean);

    facilities.push({
      externalCode: externalCode.slice(0, 64),
      title: name.slice(0, 180),
      description: bits.join(" "),
      type: listingType(category),
      region,
      city,
      address: address || null,
      included: category.slice(0, 120),
      grade,
      phone: tel || null,
    });
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "register@nziraiq.test" },
    update: {},
    create: {
      email: "register@nziraiq.test",
      name: "Tourism Register",
      passwordHash,
      role: "OPERATOR",
      operatorProfile: {
        create: {
          businessName: "Zimbabwe Registered Tourism Facilities",
          type: "ACTIVITY" satisfies OperatorType,
          verificationStatus: "VERIFIED",
          plan: "FREE",
          description:
            "Imported from the national registered tourism facilities database. Prices are confirmed by each operator.",
        },
      },
    },
    include: { operatorProfile: true },
  });

  const operatorId = owner.operatorProfile!.id;
  await prisma.listing.deleteMany({
    where: { operatorId, externalCode: { not: null } },
  });

  const chunk = 250;
  for (let i = 0; i < facilities.length; i += chunk) {
    const slice = facilities.slice(i, i + chunk);
    await prisma.listing.createMany({
      data: slice.map((f) => ({
        operatorId,
        externalCode: f.externalCode,
        title: f.title,
        description: f.description,
        type: f.type,
        region: f.region,
        city: f.city,
        address: f.address,
        price: 0,
        currency: "USD",
        capacity: f.type === "STAY" ? 4 : 10,
        photos: [PHOTOS[f.type]],
        included: f.included,
        grade: f.grade,
        rules: f.phone ? `Phone: ${f.phone}` : null,
        status: "ACTIVE" as const,
      })),
    });
    console.log(`Imported ${Math.min(i + chunk, facilities.length)} / ${facilities.length}`);
  }

  console.log(`Done. ${facilities.length} registered facilities are now listings.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
