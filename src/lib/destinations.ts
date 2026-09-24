export type Destination = {
  name: string;
  place: string;
  regionQuery: string;
  blurb: string;
  image: string;
};

const townPhotos: Record<string, string> = {
  mutare: "/photos/mutare.jpg",
  gweru: "/photos/gweru.jpg",
  kwekwe: "/photos/kwekwe.jpg",
  kadoma: "/photos/kadoma.jpg",
  rusape: "/photos/rusape.jpg",
  chirundu: "/photos/chirundu.jpg",
  beitbridge: "/photos/beitbridge.jpg",
  dete: "/photos/hwange.jpg",
  chiredzi: "/photos/gonarezhou.jpg",
  binga: "/photos/kariba.jpg",
  matusadona: "/photos/kariba.jpg",
  matetsi: "/photos/hwange.jpg",
  khami: "/photos/bulawayo.jpg",
  domboshawa: "/photos/harare.jpg",
  chitungwiza: "/photos/harare.jpg",
  karoi: "/photos/chinhoyi.jpg",
  juliasdale: "/photos/nyanga.jpg",
  troutbeck: "/photos/nyanga.jpg",
  chilojo: "/photos/gonarezhou.jpg",
  crafters: "/photos/craft-1.jpg",
  curios: "/photos/craft-1.jpg",
  community: "/photos/craft-1.jpg",
};

const remoteToLocal: [RegExp, string][] = [
  [/victoria|catarata/i, "/photos/victoria-falls.jpg"],
  [/hwange|48595113747/i, "/photos/hwange.jpg"],
  [/mana|zambezi_river/i, "/photos/mana.jpg"],
  [/great-zim|great zimbabwe/i, "/photos/great-zimbabwe.jpg"],
  [/mutirik/i, "/photos/mutirikwi.jpg"],
  [/gonarezhou|chilojo/i, "/photos/gonarezhou.jpg"],
  [/kariba/i, "/photos/kariba.jpg"],
  [/matobo/i, "/photos/matobo.jpg"],
  [/nyanga/i, "/photos/nyanga.jpg"],
  [/chimanimani/i, "/photos/chimanimani.jpg"],
  [/vumba/i, "/photos/vumba.jpg"],
  [/chinhoyi|sleeping_pool/i, "/photos/chinhoyi.jpg"],
  [/harare/i, "/photos/harare.jpg"],
  [/bulawayo/i, "/photos/bulawayo.jpg"],
  [/chirundu/i, "/photos/chirundu.jpg"],
  [/mutare/i, "/photos/mutare.jpg"],
  [/1566073771259|1520250497591|1542314831/, "/photos/stay-1.jpg"],
  [/1516426122078|1547471080|1551632811|1523805009345/, "/photos/safari-1.jpg"],
  [/1414235077428/, "/photos/food-1.jpg"],
  [/1452860606245|1489392191049/, "/photos/craft-1.jpg"],
  [/1469854523086|1507525428034/, "/photos/road-1.jpg"],
];

export const dummyPhotos: Record<string, string[]> = {
  STAY: ["/photos/stay-1.jpg", "/photos/stay-2.jpg", "/photos/stay-3.jpg"],
  ACTIVITY: ["/photos/safari-1.jpg", "/photos/safari-2.jpg", "/photos/safari-3.jpg"],
  GUIDE: ["/photos/safari-1.jpg", "/photos/safari-3.jpg", "/photos/road-1.jpg"],
  TRANSPORT: ["/photos/road-1.jpg", "/photos/safari-2.jpg"],
  EXPERIENCE: ["/photos/food-1.jpg", "/photos/craft-1.jpg", "/photos/stay-2.jpg"],
};

/** Cover image for a cluster spot — exact when known, representative nearby otherwise. */
export function coverForSpot(name: string, fallbackImage?: string | null) {
  if (fallbackImage) return fallbackImage;
  const hay = name.toLowerCase().trim();
  if (hay.includes("crafter") || hay.includes("curio") || hay.includes("craft")) {
    return townPhotos.crafters;
  }
  const fromTown = Object.keys(townPhotos)
    .sort((a, b) => b.length - a.length)
    .find((key) => hay === key || hay.includes(key));
  if (fromTown) return townPhotos[fromTown];
  return photoForPlace(name) || destinations[0]?.image;
}

export function fastPhoto(url: string) {
  if (!url || url.startsWith("/") || url.startsWith("blob:")) return url;
  for (const [pattern, local] of remoteToLocal) {
    if (pattern.test(url)) return local;
  }
  if (url.includes("images.unsplash.com")) {
    return `${url.split("?")[0]}?auto=format&fit=crop&w=640&q=55`;
  }
  return "/photos/safari-1.jpg";
}

export function listingPhoto(
  type: string,
  city?: string | null,
  region?: string | null,
  index = 0,
) {
  const place = photoForPlace(city, region);
  if (place?.startsWith("/photos/")) return place;
  const pool = dummyPhotos[type] || dummyPhotos.ACTIVITY;
  return pool[Math.abs(index) % pool.length];
}

export function photoForPlace(city?: string | null, region?: string | null) {
  const cityHay = (city || "").toLowerCase().trim();
  const regionHay = (region || "").toLowerCase().trim();
  const alias = Object.keys(townPhotos)
    .sort((a, b) => b.length - a.length)
    .find((key) => cityHay === key || cityHay.includes(key));
  if (alias) return townPhotos[alias];

  const byCity = destinations.find((d) => {
    const query = d.regionQuery.toLowerCase();
    const name = d.name.toLowerCase();
    return cityHay === query || cityHay === name || cityHay.includes(query) || cityHay.includes(name);
  });
  if (byCity) return byCity.image;

  return destinations.find((d) => {
    const query = d.regionQuery.toLowerCase();
    const name = d.name.toLowerCase();
    return regionHay === query || regionHay === name;
  })?.image;
}

export const destinations: Destination[] = [
  {
    name: "Victoria Falls",
    place: "Matabeleland North",
    regionQuery: "Victoria Falls",
    blurb: "The smoke that thunders",
    image: "/photos/victoria-falls.jpg",
  },
  {
    name: "Hwange",
    place: "Hwange National Park",
    regionQuery: "Hwange",
    blurb: "Elephant country",
    image: "/photos/hwange.jpg",
  },
  {
    name: "Mana Pools",
    place: "Zambezi Valley",
    regionQuery: "Mana Pools",
    blurb: "Canoes and walking safaris",
    image: "/photos/mana.jpg",
  },
  {
    name: "Great Zimbabwe",
    place: "Masvingo",
    regionQuery: "Masvingo",
    blurb: "Stone city of the ancestors",
    image: "/photos/great-zimbabwe.jpg",
  },
  {
    name: "Lake Mutirikwi",
    place: "Near Great Zimbabwe",
    regionQuery: "Mutirikwi",
    blurb: "The lake beside the ruins",
    image: "/photos/mutirikwi.jpg",
  },
  {
    name: "Gonarezhou",
    place: "Chilojo Cliffs",
    regionQuery: "Gonarezhou",
    blurb: "The place of elephants",
    image: "/photos/gonarezhou.jpg",
  },
  {
    name: "Lake Kariba",
    place: "Kariba",
    regionQuery: "Kariba",
    blurb: "Sunsets on the lake",
    image: "/photos/kariba.jpg",
  },
  {
    name: "Matobo",
    place: "Matobo Hills",
    regionQuery: "Matobo",
    blurb: "Granite and rock art",
    image: "/photos/matobo.jpg",
  },
  {
    name: "Nyanga",
    place: "Eastern Highlands",
    regionQuery: "Nyanga",
    blurb: "Highlands and mist",
    image: "/photos/nyanga.jpg",
  },
  {
    name: "Chimanimani",
    place: "Eastern Highlands",
    regionQuery: "Chimanimani",
    blurb: "Mountains on the border",
    image: "/photos/chimanimani.jpg",
  },
  {
    name: "Vumba",
    place: "Near Mutare",
    regionQuery: "Vumba",
    blurb: "Forests and gardens",
    image: "/photos/vumba.jpg",
  },
  {
    name: "Chinhoyi Caves",
    place: "Mashonaland West",
    regionQuery: "Chinhoyi",
    blurb: "The blue sleeping pool",
    image: "/photos/chinhoyi.jpg",
  },
  {
    name: "Harare",
    place: "Harare",
    regionQuery: "Harare",
    blurb: "Start from the capital",
    image: "/photos/harare.jpg",
  },
  {
    name: "Bulawayo",
    place: "Bulawayo",
    regionQuery: "Bulawayo",
    blurb: "City of kings",
    image: "/photos/bulawayo.jpg",
  },
];
