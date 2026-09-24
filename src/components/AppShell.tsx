"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Home,
  Briefcase,
  BarChart3,
  CalendarCheck,
  MapPinned,
  UserRound,
  LayoutDashboard,
  ListTree,
} from "lucide-react";
import { cn } from "@/lib/utils";

const touristNav = [
  { href: "/home", label: "Home", icon: Home, exact: true },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/bookings", label: "Bookings", icon: Briefcase },
  { href: "/trips", label: "Trips", icon: CalendarCheck },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const operatorNav = [
  { href: "/operator", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/operator/listings", label: "Listings", icon: ListTree },
  { href: "/operator/insights", label: "Insights", icon: BarChart3 },
  { href: "/operator/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const adminNav = [
  { href: "/intelligence", label: "Insights", icon: BarChart3, exact: true },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/explore") return pathname === "/explore" || pathname.startsWith("/listings");
  if (href === "/operator") return pathname === "/operator";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isAdminSide(role?: string) {
  return role === "ADMIN" || role === "STAKEHOLDER";
}

export function AppShell({
  children,
  role = "TRAVELER",
}: {
  children: React.ReactNode;
  role?: "TRAVELER" | "OPERATOR" | "STAKEHOLDER" | "ADMIN";
}) {
  const pathname = usePathname();
  const nav = role === "OPERATOR" ? operatorNav : isAdminSide(role) ? adminNav : touristNav;

  const homeHref =
    role === "OPERATOR" ? "/operator" : isAdminSide(role) ? "/intelligence" : "/home";
  const layerLabel =
    role === "OPERATOR" ? "Operator" : isAdminSide(role) ? "Admin" : "Tourist";
  const wide = role === "OPERATOR" || isAdminSide(role);

  return (
    <div
      className={cn(
        "relative mx-auto flex min-h-dvh w-full flex-col bg-background",
        wide ? "max-w-6xl" : "max-w-5xl",
      )}
    >
      <header
        className={cn(
          "sticky top-0 z-[var(--z-sticky)] isolate border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85",
          pathname === "/home" && "max-sm:hidden",
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href={homeHref} className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zim-green text-white">
              <MapPinned className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-wide">NziraIQ</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-muted">{layerLabel}</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
            {nav.map((item) => {
              const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-zim-green text-white"
                      : "text-muted hover:bg-black/5 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="relative z-[var(--z-base)] flex-1 px-4 py-5 pb-[calc(5.75rem+var(--safe-bottom))] sm:px-6 sm:py-6 sm:pb-8">
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] isolate border-t border-border bg-white/98 pb-[var(--safe-bottom)] backdrop-blur sm:hidden"
        aria-label="Mobile"
      >
        <div
          className={cn(
            "mx-auto flex items-stretch justify-around gap-0.5 px-1.5 py-1.5",
            wide ? "max-w-6xl" : "max-w-5xl",
          )}
        >
          {nav.map((item) => {
            const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
            const Icon = item.icon;
            const short =
              item.label === "Dashboard"
                ? "Home"
                : item.label === "Bookings"
                  ? "Inbox"
                  : item.label === "Insights"
                    ? "Stats"
                    : item.label === "Profile"
                      ? "You"
                      : item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-semibold transition",
                  active ? "bg-zim-green/[0.08] text-zim-green" : "text-muted",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                <span className="truncate">{role === "OPERATOR" ? short : item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
