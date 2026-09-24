import type { Prisma } from "@prisma/client";

export type ClusterSpot = {
  name: string;
  terms: string[];
  kind: "place" | "small";
  image?: string;
};

export type PlaceCluster = {
  key: string;
  label: string;
  anchor: string[];
  nearby: string[];
  province: string;
  aroundLabel: string;
  spots: ClusterSpot[];
};

const smallBusinessTerms = ["curio", "craft", "community", "artisan", "homestead", "weav"];

export const clusters: PlaceCluster[] = [
  {
    key: "Victoria Falls",
    label: "Victoria Falls",
    anchor: ["victoria falls", "vicoria falls"],
    nearby: ["hwange", "dete", "matetsi", "kazuma"],
    province: "Matabeleland North",
    aroundLabel: "Hwange, Matetsi, and small craft or community stops nearby",
    spots: [
      { name: "Victoria Falls", terms: ["victoria falls", "vicoria falls"], kind: "place" },
      { name: "Hwange", terms: ["hwange", "dete"], kind: "place" },
      { name: "Matetsi", terms: ["matetsi", "kazuma"], kind: "place" },
      { name: "Crafters & curios", terms: ["curio", "craft", "community", "artisan", "weav"], kind: "small" },
    ],
  },
  {
    key: "Hwange",
    label: "Hwange",
    anchor: ["hwange", "dete"],
    nearby: ["victoria falls", "vicoria falls", "matetsi", "kazuma"],
    province: "Matabeleland North",
    aroundLabel: "Victoria Falls, Matetsi, and small operators on the way",
    spots: [
      { name: "Hwange", terms: ["hwange", "dete"], kind: "place" },
      { name: "Victoria Falls", terms: ["victoria falls", "vicoria falls"], kind: "place" },
      { name: "Matetsi", terms: ["matetsi"], kind: "place" },
      { name: "Crafters & curios", terms: ["curio", "craft", "community", "artisan", "weav"], kind: "small" },
    ],
  },
  {
    key: "Masvingo",
    label: "Great Zimbabwe",
    anchor: ["masvingo", "great zimbabwe"],
    nearby: ["mutirikwi", "kyle", "morgenster", "great zimbabwe"],
    province: "Masvingo",
    aroundLabel: "Lake Mutirikwi and local crafters, curios, and community businesses",
    spots: [
      { name: "Great Zimbabwe", terms: ["great zimbabwe", "masvingo"], kind: "place" },
      {
        name: "Lake Mutirikwi",
        terms: ["mutirikwi", "mutirikwe", "kyle"],
        kind: "place",
        image:
          "/photos/mutirikwi.jpg",
      },
      { name: "Crafters & curios", terms: ["curio", "craft", "community", "artisan", "weav"], kind: "small" },
    ],
  },
  {
    key: "Kariba",
    label: "Lake Kariba",
    anchor: ["kariba"],
    nearby: ["binga", "matusadona", "chirundu", "kariba"],
    province: "Mashonaland West",
    aroundLabel: "Binga, Matusadona, Chirundu, and small lakeside businesses",
    spots: [
      {
        name: "Kariba",
        terms: ["kariba"],
        kind: "place",
        image:
          "/photos/kariba.jpg",
      },
      {
        name: "Chirundu",
        terms: ["chirundu"],
        kind: "place",
        image:
          "/photos/chirundu.jpg",
      },
      {
        name: "Binga",
        terms: ["binga"],
        kind: "place",
        image:
          "/photos/kariba.jpg",
      },
      {
        name: "Matusadona",
        terms: ["matusadona"],
        kind: "place",
        image:
          "/photos/kariba.jpg",
      },
      { name: "Crafters & curios", terms: ["curio", "craft", "community", "artisan", "weav"], kind: "small" },
    ],
  },
  {
    key: "Matobo",
    label: "Matobo",
    anchor: ["matobo", "matopos"],
    nearby: ["bulawayo", "khami", "matobo"],
    province: "Bulawayo",
    aroundLabel: "Bulawayo, Khami, and craft or community stops around the hills",
    spots: [
      { name: "Matobo", terms: ["matobo", "matopos"], kind: "place" },
      { name: "Bulawayo", terms: ["bulawayo"], kind: "place" },
      { name: "Khami", terms: ["khami"], kind: "place" },
      { name: "Crafters & curios", terms: ["curio", "craft", "community", "artisan", "weav"], kind: "small" },
    ],
  },
  {
    key: "Nyanga",
    label: "Nyanga",
    anchor: ["nyanga", "juliasdale"],
    nearby: ["mutare", "vumba", "chimanimani", "troutbeck", "nyanga"],
    province: "Manicaland",
    aroundLabel: "Mutare, Vumba, Chimanimani, and highland craft businesses",
    spots: [
      { name: "Nyanga", terms: ["nyanga", "juliasdale"], kind: "place" },
      { name: "Mutare", terms: ["mutare"], kind: "place" },
      { name: "Vumba", terms: ["vumba", "bvumba"], kind: "place" },
      { name: "Chimanimani", terms: ["chimanimani"], kind: "place" },
      { name: "Crafters & curios", terms: ["curio", "craft", "community", "artisan", "weav"], kind: "small" },
    ],
  },
  {
    key: "Harare",
    label: "Harare",
    anchor: ["harare"],
    nearby: ["chitungwiza", "domboshawa", "norton", "ruwa", "epworth"],
    province: "Harare",
    aroundLabel: "Towns around Harare and small craft or community businesses",
    spots: [
      { name: "Harare", terms: ["harare"], kind: "place" },
      { name: "Domboshawa", terms: ["domboshawa", "domboshava"], kind: "place" },
      { name: "Chitungwiza", terms: ["chitungwiza"], kind: "place" },
      { name: "Crafters & curios", terms: ["curio", "craft", "community", "artisan", "weav"], kind: "small" },
    ],
  },
  {
    key: "Bulawayo",
    label: "Bulawayo",
    anchor: ["bulawayo"],
    nearby: ["matobo", "matopos", "khami"],
    province: "Bulawayo",
    aroundLabel: "Matobo, Khami, and craft or community businesses around the city",
    spots: [
      { name: "Bulawayo", terms: ["bulawayo"], kind: "place" },
      { name: "Matobo", terms: ["matobo", "matopos"], kind: "place" },
      { name: "Khami", terms: ["khami"], kind: "place" },
      { name: "Crafters & curios", terms: ["curio", "craft", "community", "artisan", "weav"], kind: "small" },
    ],
  },
  {
    key: "Mana Pools",
    label: "Mana Pools",
    anchor: ["mana pools", "manapools"],
    nearby: ["chirundu", "kariba", "chinhoyi"],
    province: "Mashonaland West",
    aroundLabel: "Chirundu, Kariba, and small businesses on the Zambezi road",
    spots: [
      {
        name: "Mana Pools",
        terms: ["mana pools", "manapools"],
        kind: "place",
        image:
          "/photos/mana.jpg",
      },
      {
        name: "Chirundu",
        terms: ["chirundu"],
        kind: "place",
        image:
          "/photos/chirundu.jpg",
      },
      {
        name: "Kariba",
        terms: ["kariba"],
        kind: "place",
        image:
          "/photos/kariba.jpg",
      },
      { name: "Crafters & curios", terms: ["curio", "craft", "community", "artisan", "weav"], kind: "small" },
    ],
  },
  {
    key: "Gonarezhou",
    label: "Gonarezhou",
    anchor: ["gonarezhou", "goanarezhou"],
    nearby: ["chiredzi", "chilojo"],
    province: "Masvingo",
    aroundLabel: "Chiredzi and small businesses around the park",
    spots: [
      { name: "Gonarezhou", terms: ["gonarezhou", "goanarezhou", "chilojo"], kind: "place" },
      { name: "Chiredzi", terms: ["chiredzi"], kind: "place" },
      { name: "Crafters & curios", terms: ["curio", "craft", "community", "artisan", "weav"], kind: "small" },
    ],
  },
  {
    key: "Chinhoyi",
    label: "Chinhoyi Caves",
    anchor: ["chinhoyi"],
    nearby: ["mana pools", "manapools", "karoi"],
    province: "Mashonaland West",
    aroundLabel: "Karoi, Mana Pools, and small stays on the way north",
    spots: [
      { name: "Chinhoyi Caves", terms: ["chinhoyi"], kind: "place" },
      { name: "Karoi", terms: ["karoi"], kind: "place" },
      { name: "Mana Pools", terms: ["mana pools", "manapools"], kind: "place" },
      { name: "Crafters & curios", terms: ["curio", "craft", "community", "artisan", "weav"], kind: "small" },
    ],
  },
];

export function findCluster(query?: string | null) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return null;
  return (
    clusters.find(
      (c) =>
        c.key.toLowerCase() === q ||
        c.label.toLowerCase() === q ||
        c.anchor.some((a) => q === a || q.includes(a)) ||
        c.spots.some((s) => s.name.toLowerCase() === q || s.terms.some((t) => t === q)),
    ) ?? null
  );
}

export function spotWhere(cluster: PlaceCluster, spot: ClusterSpot): Prisma.ListingWhereInput {
  if (spot.kind === "small") {
    return {
      AND: [
        { region: { contains: cluster.province, mode: "insensitive" } },
        containsAny(["included", "title", "description"], spot.terms),
      ],
    };
  }
  const fields: Array<"city" | "title" | "address"> =
    spot.name === cluster.label ? ["city", "title"] : ["city", "title", "address"];
  return containsAny(fields, spot.terms);
}

function containsAny(
  fields: Array<"city" | "title" | "address" | "region" | "included" | "description">,
  terms: string[],
): Prisma.ListingWhereInput {
  return {
    OR: terms.flatMap((term) =>
      fields.map((field) => ({
        [field]: { contains: term, mode: "insensitive" as const },
      })),
    ),
  };
}

export function anchorWhere(cluster: PlaceCluster): Prisma.ListingWhereInput {
  return containsAny(["city", "title"], cluster.anchor);
}

export function aroundWhere(cluster: PlaceCluster): Prisma.ListingWhereInput {
  return {
    AND: [
      { NOT: anchorWhere(cluster) },
      {
        OR: [
          containsAny(["city", "title", "address"], cluster.nearby),
          {
            AND: [
              { region: { contains: cluster.province, mode: "insensitive" } },
              containsAny(["included", "title", "description"], smallBusinessTerms),
            ],
          },
        ],
      },
    ],
  };
}
