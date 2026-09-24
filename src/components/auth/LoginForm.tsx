"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Mail, MapPinned } from "lucide-react";
import { AuthFrame } from "@/components/onboarding/OnboardingFlow";
import { Button } from "@/components/ui/Button";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.54-4.7 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.26h3.34l-.53 3.49h-2.81V24C19.61 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}

type Method = "choose" | "email";

export function LoginForm({
  googleEnabled: _googleEnabled,
  facebookEnabled: _facebookEnabled,
}: {
  googleEnabled: boolean;
  facebookEnabled: boolean;
}) {
  const [method, setMethod] = useState<Method>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"google" | "facebook" | "email" | null>(null);

  async function oauth(_provider: "google" | "facebook") {
    // OAuth providers are placeholders for now — do nothing.
  }

  async function onEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (!res?.ok || res.error) {
      setLoading(null);
      setError("Invalid email or password.");
      return;
    }
    // Hard navigation so the session cookie is sent on the next request (and on refresh).
    window.location.assign("/home");
  }

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
          <p className="mt-1 text-sm font-medium tracking-wide text-white/90">Discover Zimbabwe</p>
        </>
      }
    >
      <div className="text-center">
        <h1 className="text-[2rem] font-bold uppercase tracking-wide text-zim-black sm:text-[2.25rem]">
          Login
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
          Welcome back. Continue where you left off.
        </p>
      </div>

      <div className="auth-sheet-actions">
        {method === "choose" ? (
          <>
            <button
              type="button"
              onClick={() => oauth("google")}
              disabled={loading !== null}
              className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-zim-black/80 bg-white px-6 py-3.5 text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-50"
            >
              <GoogleIcon />
              {loading === "google" ? "Opening Google…" : "Continue with Google"}
            </button>

            <button
              type="button"
              onClick={() => oauth("facebook")}
              disabled={loading !== null}
              className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-zim-black/80 bg-white px-6 py-3.5 text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-50"
            >
              <FacebookIcon />
              {loading === "facebook" ? "Opening Facebook…" : "Continue with Facebook"}
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setMethod("email");
              }}
              disabled={loading !== null}
              className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-zim-black px-6 py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              <Mail className="h-5 w-5" />
              Continue with Email
            </button>
          </>
        ) : (
          <form onSubmit={onEmailSubmit} className="w-full space-y-3 text-left">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-full border border-border bg-white px-4 py-3.5 text-sm outline-none ring-zim-green focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Password</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-full border border-border bg-white px-4 py-3.5 text-sm outline-none ring-zim-green focus:ring-2"
              />
            </label>
            <Button type="submit" fullWidth disabled={loading === "email"} className="mt-1">
              {loading === "email" ? "Signing in…" : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setMethod("choose");
                setError("");
              }}
              className="w-full py-1 text-sm font-medium text-muted hover:text-zim-black"
            >
              Other sign-in options
            </button>
          </form>
        )}

        {error && <p className="text-center text-sm text-zim-red">{error}</p>}

        <p className="text-center text-sm text-muted">
          New here?{" "}
          <Link href="/register" className="font-semibold text-zim-green">
            Sign Up
          </Link>
        </p>
        <p className="text-center text-[11px] text-muted">
          Demo: traveler@nziraiq.test · operator@nziraiq.test · admin@nziraiq.test
        </p>
      </div>
    </AuthFrame>
  );
}
