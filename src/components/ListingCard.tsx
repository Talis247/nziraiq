import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import { priceLabel } from "@/lib/utils";
import { fastPhoto, photoForPlace } from "@/lib/destinations";

type ListingCardProps = {
  id: string;
  title: string;
  region: string;
  city?: string | null;
  type: string;
  price: number;
  currency: string;
  ratingAvg: number;
  photos: string[];
  included?: string | null;
  grade?: string | null;
  compact?: boolean;
};

export function ListingCard({
  id,
  title,
  region,
  city,
  type,
  price,
  currency,
  ratingAvg,
  photos,
  included,
  grade,
  compact,
}: ListingCardProps) {
  const category = (included || type).replace(/_/g, " ").toLowerCase();
  const uploaded = photos.find(
    (src) => src && (src.startsWith("/uploads/") || (!src.includes("images.unsplash.com") && src.length > 0)),
  );
  const photo = uploaded || photoForPlace(city, region);

  return (
    <Link
      href={`/listings/${id}`}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-black/[0.06]"
    >
      <div className={`relative w-full shrink-0 overflow-hidden bg-black/[0.04] ${compact ? "aspect-[5/4]" : "aspect-[4/3]"}`}>
        {photo ? (
          // Native image skips the optimizer so the place thumb paints immediately.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fastPhoto(photo)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : null}
        <span className="absolute left-2 top-2 z-[1] max-w-[calc(100%-1rem)] truncate rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium capitalize text-zim-black/80">
          {category}
        </span>
      </div>
      <div className={`flex min-w-0 flex-1 flex-col ${compact ? "gap-1 p-2.5" : "space-y-1.5 p-4"}`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className={`line-clamp-2 min-w-0 flex-1 font-semibold leading-snug ${compact ? "text-[13px]" : "text-[15px]"}`}>
            {title}
          </h3>
          {ratingAvg > 0 && (
            <div className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-zim-gold">
              <Star className="h-3.5 w-3.5 fill-current" />
              {ratingAvg.toFixed(1)}
            </div>
          )}
        </div>
        <p className="flex min-w-0 items-center gap-1 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{city ? `${city}, ${region}` : region}</span>
        </p>
        <p className={`mt-auto font-bold text-zim-green ${compact ? "pt-1 text-xs" : "pt-1 text-sm"}`}>
          {priceLabel(price, currency)}
          {price > 0 && <span className="font-medium text-muted"> / person</span>}
        </p>
        {grade && !compact && <p className="text-[11px] text-muted">{grade}</p>}
      </div>
    </Link>
  );
}
