export type Destination = {
  name: string;
  place: string;
  regionQuery: string;
  blurb: string;
  image: string;
};

const townPhotos: Record<string, string> = {
  mutare: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Mutare_aerial.jpg/640px-Mutare_aerial.jpg",
  gweru: "https://upload.wikimedia.org/wikipedia/commons/1/11/Gweru_Memorial_Library.jpg",
  kwekwe: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Kwekwe_Mosque.jpg",
  kadoma: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Kadoma_Townhall.JPG/640px-Kadoma_Townhall.JPG",
  rusape: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Rusape_Dam.jpg/640px-Rusape_Dam.jpg",
  chirundu: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/The_Chirundu_Bridge.jpg/640px-The_Chirundu_Bridge.jpg",
  beitbridge: "https://upload.wikimedia.org/wikipedia/commons/7/72/Beitbridge_borderpost.jpg",
  dete: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Hwange_National_Park%2C_Zimbabwe_%2848595113747%29.jpg/640px-Hwange_National_Park%2C_Zimbabwe_%2848595113747%29.jpg",
  chiredzi: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Zimbabwe_Gonarezhou_Landscape_Chilojo_Cliffs.jpg/640px-Zimbabwe_Gonarezhou_Landscape_Chilojo_Cliffs.jpg",
};

export function fastPhoto(url: string) {
  if (!url || url.startsWith("/") || url.startsWith("blob:")) return url;
  const clean = url.split("?")[0];
  if (clean.includes("thumb.wikimedia.org") || clean.includes("/thumb/")) {
    return clean
      .replace("https://thumb.wikimedia.org/", "https://upload.wikimedia.org/")
      .replace(/\/\d+px-/, "/960px-");
  }
  const file = clean.match(
    /https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/i,
  );
  if (file) {
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${file[1]}/${file[2]}/${file[3]}/960px-${file[3]}`;
  }
  return clean;
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
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_30-34_PAN.jpg/1280px-Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_30-34_PAN.jpg",
  },
  {
    name: "Hwange",
    place: "Hwange National Park",
    regionQuery: "Hwange",
    blurb: "Elephant country",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Hwange_National_Park%2C_Zimbabwe_%2848595113747%29.jpg/1280px-Hwange_National_Park%2C_Zimbabwe_%2848595113747%29.jpg",
  },
  {
    name: "Mana Pools",
    place: "Zambezi Valley",
    regionQuery: "Mana Pools",
    blurb: "Canoes and walking safaris",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Island_in_the_Zambezi_River_at_Mana_Pools_National_Park-1.jpg/1280px-Island_in_the_Zambezi_River_at_Mana_Pools_National_Park-1.jpg",
  },
  {
    name: "Great Zimbabwe",
    place: "Masvingo",
    regionQuery: "Masvingo",
    blurb: "Stone city of the ancestors",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Great-zim-aerial-looking-West.JPG/1280px-Great-zim-aerial-looking-West.JPG",
  },
  {
    name: "Lake Mutirikwi",
    place: "Near Great Zimbabwe",
    regionQuery: "Mutirikwi",
    blurb: "The lake beside the ruins",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Lake_Mutirikwe.jpg/1280px-Lake_Mutirikwe.jpg",
  },
  {
    name: "Gonarezhou",
    place: "Chilojo Cliffs",
    regionQuery: "Gonarezhou",
    blurb: "The place of elephants",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/6/6a/Zimbabwe_Gonarezhou_Landscape_Chilojo_Cliffs.jpg",
  },
  {
    name: "Lake Kariba",
    place: "Kariba",
    regionQuery: "Kariba",
    blurb: "Sunsets on the lake",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Lake_Kariba.jpg/1280px-Lake_Kariba.jpg",
  },
  {
    name: "Matobo",
    place: "Matobo Hills",
    regionQuery: "Matobo",
    blurb: "Granite and rock art",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Sunrise_Matobo_Zimbabwe.jpg",
  },
  {
    name: "Nyanga",
    place: "Eastern Highlands",
    regionQuery: "Nyanga",
    blurb: "Highlands and mist",
    image: "https://upload.wikimedia.org/wikipedia/commons/9/96/Central_nyanga_np.jpg",
  },
  {
    name: "Chimanimani",
    place: "Eastern Highlands",
    regionQuery: "Chimanimani",
    blurb: "Mountains on the border",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chimanimani-mountains.jpg",
  },
  {
    name: "Vumba",
    place: "Near Mutare",
    regionQuery: "Vumba",
    blurb: "Forests and gardens",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Vumba%2C_Zimbabwe.jpg/1280px-Vumba%2C_Zimbabwe.jpg",
  },
  {
    name: "Chinhoyi Caves",
    place: "Mashonaland West",
    regionQuery: "Chinhoyi",
    blurb: "The blue sleeping pool",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Sleeping_Pool%2C_Chinhoyi_Caves%2C_Zimbabwe.JPG/1280px-Sleeping_Pool%2C_Chinhoyi_Caves%2C_Zimbabwe.JPG",
  },
  {
    name: "Harare",
    place: "Harare",
    regionQuery: "Harare",
    blurb: "Start from the capital",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/42/Harare_Skyline.jpg",
  },
  {
    name: "Bulawayo",
    place: "Bulawayo",
    regionQuery: "Bulawayo",
    blurb: "City of kings",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Bulawayo_City_Hall.jpg/1280px-Bulawayo_City_Hall.jpg",
  },
];
