"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ListTree } from "lucide-react";
import { CreateListingForm } from "@/components/CreateListingForm";
import { priceLabel } from "@/lib/utils";
import type { OperatorType } from "@prisma/client";

type ListingRow = {
  id: string;
  title: string;
  type: string;
  region: string;
  city: string | null;
  status: string;
  price: number;
  currency: string;
  photos: string[];
};

export function OperatorListingsView({
  operatorType,
  businessName,
  listings,
}: {
  operatorType: OperatorType;
  businessName: string;
  listings: ListingRow[];
}) {
  const [tab, setTab] = useState<"published" | "new">(
    listings.length === 0 ? "new" : "published",
  );

  return (
    <div className="flex flex-col gap-5 sm:gap-6 lg:gap-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zim-red">
          Listings
        </p>
        <h1 className="mt-1 text-[1.65rem] font-bold leading-tight tracking-tight sm:text-3xl">
          Your services
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Publish stays and experiences with real photos tourists can trust.
        </p>
        <p className="mt-2 text-xs font-medium capitalize text-zim-green">
          {operatorType.toLowerCase().replaceAll("_", " ")} · {businessName}
        </p>
      </div>

      {/* Mobile tabs — keep forms from burying listings */}
      <div className="flex gap-1 rounded-full bg-black/[0.04] p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setTab("published")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold transition ${
            tab === "published" ? "bg-white shadow-sm" : "text-muted"
          }`}
        >
          <ListTree className="h-4 w-4" />
          Published
          <span className="rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[10px] tabular-nums">
            {listings.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("new")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold transition ${
            tab === "new" ? "bg-white shadow-sm" : "text-muted"
          }`}
        >
          <Plus className="h-4 w-4" />
          Add new
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className={`lg:col-span-2 ${tab === "new" ? "block" : "hidden lg:block"}`}>
          <CreateListingForm
            operatorType={operatorType}
            onPublished={() => setTab("published")}
          />
        </div>

        <div className={`space-y-3 lg:col-span-3 ${tab === "published" ? "block" : "hidden lg:block"}`}>
          <div className="hidden items-center justify-between gap-3 lg:flex">
            <h2 className="text-lg font-bold">Published</h2>
            <span className="text-xs font-medium text-muted">
              {listings.length} {listings.length === 1 ? "listing" : "listings"}
            </span>
          </div>

          {listings.length === 0 && (
            <div className="rounded-[1.25rem] bg-white px-5 py-10 text-center ring-1 ring-black/[0.06]">
              <p className="text-sm text-muted">
                No listings yet — switch to Add new and publish your first one.
              </p>
              <button
                type="button"
                onClick={() => setTab("new")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-zim-black px-4 py-2.5 text-sm font-semibold text-white lg:hidden"
              >
                <Plus className="h-4 w-4" />
                Add listing
              </button>
            </div>
          )}

          {listings.map((l) => {
            const thumb =
              l.photos.find((p) => p && !p.includes("images.unsplash.com")) || l.photos[0];
            return (
              <article
                key={l.id}
                className="overflow-hidden rounded-[1.15rem] bg-white ring-1 ring-black/[0.06]"
              >
                <div className="flex gap-3 p-3 sm:p-4">
                  <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-black/[0.04] sm:h-24 sm:w-24">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/listings/${l.id}`}
                          className="line-clamp-2 font-semibold leading-snug hover:text-zim-green"
                        >
                          {l.title}
                        </Link>
                        <p className="mt-1 text-[11px] capitalize leading-relaxed text-muted sm:text-xs">
                          {l.type.toLowerCase()} · {l.city || l.region}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          l.status === "ACTIVE"
                            ? "bg-zim-green/10 text-zim-green"
                            : "bg-black/5 text-muted"
                        }`}
                      >
                        {l.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-zim-green">
                      {priceLabel(l.price, l.currency)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px border-t border-black/[0.06] bg-black/[0.04]">
                  <Link
                    href={`/operator/availability/${l.id}`}
                    className="bg-white py-2.5 text-center text-xs font-semibold"
                  >
                    Availability
                  </Link>
                  <Link
                    href={`/listings/${l.id}`}
                    className="bg-white py-2.5 text-center text-xs font-semibold text-zim-red"
                  >
                    Public page
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
