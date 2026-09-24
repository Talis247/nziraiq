"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { destinations } from "@/lib/destinations";
import type { OperatorType } from "@prisma/client";

const listingTypes = [
  { value: "STAY", label: "Stay" },
  { value: "ACTIVITY", label: "Activity" },
  { value: "GUIDE", label: "Guide" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "EXPERIENCE", label: "Experience" },
] as const;

const field =
  "w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none ring-zim-green focus:ring-2";

function defaultListingType(operatorType?: OperatorType) {
  if (operatorType === "LODGE" || operatorType === "GUESTHOUSE") return "STAY";
  if (operatorType === "GUIDE") return "GUIDE";
  if (operatorType === "TRANSPORT") return "TRANSPORT";
  if (operatorType === "COMMUNITY") return "EXPERIENCE";
  return "ACTIVITY";
}

export function CreateListingForm({
  operatorType,
  onPublished,
}: {
  operatorType?: OperatorType;
  onPublished?: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: defaultListingType(operatorType),
    region: "Harare",
    city: "",
    price: 0,
    capacity: 4,
    included: "",
  });

  const placeOptions = useMemo(
    () => destinations.map((d) => d.regionQuery).filter((v, i, a) => a.indexOf(v) === i),
    [],
  );

  async function onFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError("");
    const remaining = 6 - photos.length;
    if (remaining <= 0) {
      setError("You can add up to 6 photos.");
      return;
    }
    const selected = Array.from(fileList).slice(0, remaining);
    const body = new FormData();
    selected.forEach((file) => body.append("files", file));
    const res = await fetch("/api/operator/uploads", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not upload photos.");
      return;
    }
    setPhotos((prev) => [...prev, ...(data.urls as string[])]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (photos.length === 0) {
      setError("Add at least one photo of the place or activity.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/operator/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, photos }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not create listing.");
      return;
    }
    setForm({
      title: "",
      description: "",
      type: defaultListingType(operatorType),
      region: "Harare",
      city: "",
      price: 0,
      capacity: 4,
      included: "",
    });
    setPhotos([]);
    onPublished?.();
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3.5 rounded-[1.25rem] bg-white p-4 ring-1 ring-black/[0.06] sm:space-y-3 sm:p-5"
    >
      <div>
        <h2 className="text-lg font-bold">New listing</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Add photos of the real place or activity. Price 0 shows “on request”.
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Photos</span>
          <span className="text-[11px] text-muted">{photos.length}/6</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((src) => (
            <div key={src} className="relative aspect-square overflow-hidden rounded-2xl bg-black/[0.04]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((p) => p !== src))}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {photos.length < 6 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-black/15 bg-black/[0.02] text-muted transition hover:border-zim-green/40 hover:text-zim-green"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px] font-semibold">Add</span>
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => onFilesSelected(e.target.files)}
        />
      </div>

      <input
        required
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className={field}
      />
      <textarea
        required
        placeholder="Describe the stay, tour, or service"
        rows={4}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full rounded-[1.15rem] border border-border bg-white px-4 py-3 text-sm outline-none ring-zim-green focus:ring-2"
      />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {listingTypes.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setForm({ ...form, type: t.value })}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
              form.type === t.value
                ? "bg-zim-black text-white"
                : "bg-black/[0.04] text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <select
          value={form.region}
          onChange={(e) => setForm({ ...form, region: e.target.value })}
          className={field}
        >
          {placeOptions.map((place) => (
            <option key={place} value={place}>
              {place}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
        <input
          placeholder="Town / area"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className={field}
        />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <input
          type="number"
          min={0}
          required
          placeholder="Price USD"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          className={field}
        />
        <input
          type="number"
          min={1}
          required
          placeholder="Capacity"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
          className={field}
        />
      </div>
      <input
        placeholder="What's included"
        value={form.included}
        onChange={(e) => setForm({ ...form, included: e.target.value })}
        className={field}
      />
      {error && <p className="text-sm text-zim-red">{error}</p>}
      <Button type="submit" fullWidth disabled={loading}>
        {loading ? "Publishing…" : "Publish listing"}
      </Button>
    </form>
  );
}
