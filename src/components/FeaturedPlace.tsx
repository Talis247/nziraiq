"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Destination } from "@/lib/destinations";

export function FeaturedPlace({ places }: { places: Destination[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (places.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % places.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [places.length]);

  const place = places[index] ?? places[0];
  if (!place) return null;

  return (
    <Link
      href={`/explore?region=${encodeURIComponent(place.regionQuery)}`}
      className="relative mt-5 block h-56 overflow-hidden rounded-[1.6rem] shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:h-64 lg:mt-0 lg:h-[22rem] lg:rounded-[1.75rem]"
    >
      {places.map((item, i) => (
        <Image
          key={item.name}
          src={item.image}
          alt=""
          fill
          priority={i === 0}
          unoptimized
          className={`object-cover transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          sizes="(max-width: 1024px) 100vw, 720px"
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" />
      <span className="absolute left-4 top-4 rounded-full bg-zim-red px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:left-5 sm:top-5">
        Discover
      </span>
      <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5 lg:p-6">
        <p className="text-2xl font-bold lg:text-3xl">{place.name}</p>
        <p className="mt-1 max-w-lg text-sm text-white/85 lg:text-base">{place.blurb}</p>
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zim-black">
          Explore now
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
