import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.listingView.deleteMany();
  await prisma.searchEvent.deleteMany();
  await prisma.insight.deleteMany();
  await prisma.itineraryStop.deleteMany();
  await prisma.itinerary.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.travelerProfile.deleteMany();
  await prisma.operatorProfile.deleteMany();
  await prisma.stakeholderProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const traveler = await prisma.user.create({
    data: {
      email: "traveler@nziraiq.test",
      name: "Tariro Moyo",
      passwordHash,
      role: "TRAVELER",
      travelerProfile: {
        create: {
          budgetDefault: 300,
          interests: ["nature", "culture", "community"],
          groupSize: 2,
          homeLocation: "Harare",
        },
      },
    },
  });

  const operatorUser = await prisma.user.create({
    data: {
      email: "operator@nziraiq.test",
      name: "Chiedza Ncube",
      passwordHash,
      role: "OPERATOR",
      operatorProfile: {
        create: {
          businessName: "Highlands Horizon Experiences",
          type: "ACTIVITY",
          verificationStatus: "VERIFIED",
          plan: "FREE",
          description: "Community-rooted adventures across Zimbabwe.",
          phone: "+263771000001",
        },
      },
    },
    include: { operatorProfile: true },
  });

  const lodgeUser = await prisma.user.create({
    data: {
      email: "lodge@nziraiq.test",
      name: "Farai Dube",
      passwordHash,
      role: "OPERATOR",
      operatorProfile: {
        create: {
          businessName: "Falls Mist Lodge",
          type: "LODGE",
          verificationStatus: "VERIFIED",
          plan: "PAID",
          description: "Affordable stays near Victoria Falls.",
        },
      },
    },
    include: { operatorProfile: true },
  });

  await prisma.user.create({
    data: {
      email: "admin@nziraiq.test",
      name: "ZimTour Pulse Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  // Legacy demo login still works for the intelligence dashboard
  await prisma.user.create({
    data: {
      email: "stakeholder@nziraiq.test",
      name: "Zim Tourism Board Analyst",
      passwordHash,
      role: "ADMIN",
      stakeholderProfile: {
        create: {
          orgName: "Zimbabwe Tourism Authority (demo)",
          orgType: "BOARD",
          subscriptionTier: "BASIC",
        },
      },
    },
  });

  const opId = operatorUser.operatorProfile!.id;
  const lodgeId = lodgeUser.operatorProfile!.id;

  const listings = await Promise.all([
    prisma.listing.create({
      data: {
        operatorId: lodgeId,
        title: "Falls Mist Family Cottage",
        description:
          "A quiet, affordable cottage 15 minutes from Victoria Falls with breakfast and local guide tips. Perfect for first-time visitors who want comfort without resort prices.",
        type: "STAY",
        region: "Victoria Falls",
        city: "Victoria Falls",
        price: 65,
        capacity: 4,
        photos: [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
        ],
        included: "Breakfast, Wi‑Fi, airport pickup tip sheet",
        ratingAvg: 4.7,
        ratingCount: 28,
        lat: -17.9243,
        lng: 25.8572,
      },
    }),
    prisma.listing.create({
      data: {
        operatorId: opId,
        title: "Harare Botanical Walk & Street Food",
        description:
          "Half-day nature walk through Harare gardens finished with curated street-food tasting from community vendors.",
        type: "EXPERIENCE",
        region: "Harare",
        city: "Harare",
        price: 28,
        capacity: 8,
        photos: [
          "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
        ],
        included: "Guide, tasting samples, water",
        ratingAvg: 4.8,
        ratingCount: 41,
      },
    }),
    prisma.listing.create({
      data: {
        operatorId: opId,
        title: "Eastern Highlands Hiking Day",
        description:
          "Guided hike through Nyanga pine forests and viewpoints with a community lunch stop. Ideal for nature lovers on a mid-range budget.",
        type: "ACTIVITY",
        region: "Eastern Highlands",
        city: "Nyanga",
        price: 45,
        capacity: 10,
        photos: [
          "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80",
        ],
        included: "Guide, packed lunch, park entry support",
        ratingAvg: 4.9,
        ratingCount: 33,
      },
    }),
    prisma.listing.create({
      data: {
        operatorId: opId,
        title: "Matobo Hills Cultural Trail",
        description:
          "Spend a day with a local guide among the granite balancing rocks, rock art sites and community storytelling.",
        type: "GUIDE",
        region: "Matobo",
        city: "Bulawayo",
        price: 55,
        capacity: 6,
        photos: [
          "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80",
        ],
        included: "Guide, transport from Bulawayo, refreshments",
        ratingAvg: 4.6,
        ratingCount: 19,
      },
    }),
    prisma.listing.create({
      data: {
        operatorId: lodgeId,
        title: "Zambezi Sunset Boat Transfer",
        description:
          "Shared sunset boat experience on the Zambezi with soft drinks. A lighter-cost option than full dinner cruises.",
        type: "TRANSPORT",
        region: "Victoria Falls",
        city: "Victoria Falls",
        price: 35,
        capacity: 12,
        photos: [
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        ],
        included: "Boat seat, soft drink, life jacket",
        ratingAvg: 4.5,
        ratingCount: 52,
      },
    }),
    prisma.listing.create({
      data: {
        operatorId: opId,
        title: "Community Craft & Homestead Visit",
        description:
          "Meet artisans near Mutare, learn basket weaving basics and share a meal with a host family. Designed for authentic, ethical tourism.",
        type: "EXPERIENCE",
        region: "Eastern Highlands",
        city: "Mutare",
        price: 32,
        capacity: 8,
        photos: [
          "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1200&q=80",
        ],
        included: "Host fee, meal, craft materials",
        ratingAvg: 4.9,
        ratingCount: 17,
      },
    }),
  ]);

  const today = new Date();
  for (const listing of listings) {
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      date.setHours(0, 0, 0, 0);
      await prisma.availability.create({
        data: {
          listingId: listing.id,
          date,
          capacityRemaining: listing.capacity,
          slotsOpen: 1,
        },
      });
    }
  }

  await prisma.searchEvent.createMany({
    data: [
      {
        userId: traveler.id,
        query: "nature from Harare",
        interests: ["nature"],
        region: "Harare",
        budgetBand: "150_400",
      },
      {
        query: "Eastern Highlands hiking",
        interests: ["hiking", "nature"],
        region: "Eastern Highlands",
        budgetBand: "150_400",
      },
      {
        query: "Victoria Falls affordable stay",
        interests: ["family"],
        region: "Victoria Falls",
        budgetBand: "150_400",
      },
      {
        query: "Matobo culture",
        interests: ["culture"],
        region: "Matobo",
        budgetBand: "150_400",
      },
      {
        query: "Eastern Highlands community",
        interests: ["community"],
        region: "Eastern Highlands",
        budgetBand: "under_150",
      },
      {
        query: "Eastern Highlands adventure",
        interests: ["adventure"],
        region: "Eastern Highlands",
        budgetBand: "150_400",
      },
      {
        query: "Kariba fishing",
        interests: ["nature"],
        region: "Kariba",
        budgetBand: "400_800",
      },
      {
        query: "Kariba sunset",
        interests: ["nature"],
        region: "Kariba",
        budgetBand: "400_800",
      },
      {
        query: "Kariba lodge",
        interests: ["family"],
        region: "Kariba",
        budgetBand: "400_800",
      },
      {
        query: "Kariba weekend",
        interests: ["adventure"],
        region: "Kariba",
        budgetBand: "400_800",
      },
    ],
  });

  console.log("Seeded ZimTour Pulse demo data.");
  console.log("Logins (password: password123):");
  console.log("  traveler@nziraiq.test  (Tourist)");
  console.log("  operator@nziraiq.test  (Operator — services)");
  console.log("  lodge@nziraiq.test     (Operator — resort)");
  console.log("  admin@nziraiq.test     (Admin — intelligence)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
