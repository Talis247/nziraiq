"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Compass,
  MessageSquareText,
  Store,
  ChevronRight,
  MapPinned,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "nziraiq_onboarding_done";

const slides = [
  {
    id: 1,
    eyebrow: "Discover",
    title: "Beyond the big hits",
    body: "Find authentic stays, guides and community experiences across Zimbabwe — not just the famous ones.",
    image:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1400&q=80",
    icon: Compass,
    accent: "var(--zim-green)",
  },
  {
    id: 2,
    eyebrow: "Plan",
    title: "Chat your trip into shape",
    body: "Tell the AI Copilot your budget, interests and days. Get a day-by-day plan grounded in real listings.",
    image:
      "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=1400&q=80",
    icon: MessageSquareText,
    accent: "var(--zim-gold)",
  },
  {
    id: 3,
    eyebrow: "Book & grow",
    title: "Book local. Power the sector.",
    body: "Support operators of every size. Every search and booking becomes insight that helps tourism grow smarter.",
    image:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1400&q=80",
    icon: Store,
    accent: "var(--zim-red)",
  },
];

export function AuthFrame({
  image,
  imageAlt,
  brand,
  children,
}: {
  image: string;
  imageAlt: string;
  brand: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-frame">
      <section className="auth-hero">
        <div className="auth-hero-media">
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority
            className="object-cover animate-fade-in"
            sizes="(max-width: 1023px) 100vw, 55vw"
          />
        </div>
        <div className="auth-hero-scrim" />
        <div className="auth-hero-brand">{brand}</div>
      </section>

      <section className="auth-sheet">
        <div className="auth-sheet-curve" aria-hidden="true">
          <svg viewBox="0 0 400 56" preserveAspectRatio="none">
            <path d="M0 56 C 80 4, 320 4, 400 56 Z" fill="#ffffff" />
          </svg>
        </div>
        <div className="auth-sheet-scroll">{children}</div>
      </section>
    </div>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (done === "1") {
      router.replace("/welcome");
      return;
    }
    setReady(true);
  }, [router]);

  const slide = slides[index];
  const Icon = slide.icon;
  const isLast = index === slides.length - 1;

  const progress = useMemo(() => slides.map((_, i) => i === index), [index]);

  function finish() {
    localStorage.setItem(ONBOARDING_KEY, "1");
    router.push("/welcome");
  }

  function next() {
    if (isLast) finish();
    else setIndex((v) => v + 1);
  }

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-zim-black">
        <div className="h-8 w-8 animate-pulse rounded-full bg-zim-gold" />
      </div>
    );
  }

  return (
    <AuthFrame
      image={slide.image}
      imageAlt={slide.title}
      brand={
        <>
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg sm:h-20 sm:w-20">
            <Icon
              className="h-7 w-7 sm:h-9 sm:w-9"
              style={{ color: slide.accent }}
              strokeWidth={1.75}
            />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zim-gold-bright sm:text-xs">
            NziraIQ
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/85 sm:text-[11px]">
            Zimbabwe Tourism
          </p>
        </>
      }
    >
      <div className="text-center">
        <p
          className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: slide.accent }}
        >
          {slide.eyebrow}
        </p>
        <h1 className="animate-fade-up text-[1.65rem] font-bold uppercase leading-tight tracking-wide text-zim-black sm:text-[2rem]">
          {slide.title}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted animate-fade-up sm:text-[15px]">
          {slide.body}
        </p>

        <div
          className="mt-6 flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Onboarding progress"
        >
          {progress.map((active, i) => (
            <button
              key={slides[i].id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                active ? "w-7 bg-zim-green" : "w-2 bg-black/15",
              )}
            />
          ))}
        </div>
      </div>

      <div className="auth-sheet-actions">
        <Button fullWidth onClick={next} className="bg-zim-green hover:bg-zim-green-dark">
          {isLast ? "Get started" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isLast && (
          <button
            type="button"
            onClick={finish}
            className="py-1 text-sm font-medium text-muted hover:text-zim-black"
          >
            Skip
          </button>
        )}
      </div>
    </AuthFrame>
  );
}

export function WelcomeScreen() {
  return (
    <AuthFrame
      image="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1400&q=80"
      imageAlt="Zimbabwe landscape"
      brand={
        <>
          <div className="mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-xl sm:h-[88px] sm:w-[88px]">
            <MapPinned className="h-8 w-8 text-zim-green sm:h-10 sm:w-10" strokeWidth={1.6} />
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-[0.12em] text-white drop-shadow sm:text-3xl">
            NziraIQ
          </h2>
          <p className="mt-1 text-sm font-medium tracking-wide text-white/90">
            Discover Zimbabwe
          </p>
        </>
      }
    >
      <div className="text-center">
        <h1 className="text-[2rem] font-bold uppercase tracking-wide text-zim-black sm:text-[2.35rem]">
          Welcome
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted sm:text-[15px]">
          Plan trips with AI, book real local experiences, and explore Zimbabwe beyond the usual
          path.
        </p>
      </div>

      <div className="auth-sheet-actions">
        <Button href="/login" fullWidth>
          Login
        </Button>
        <Button href="/register" variant="secondary" fullWidth>
          Sign Up
        </Button>
      </div>
    </AuthFrame>
  );
}
