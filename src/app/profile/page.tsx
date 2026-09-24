import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { SignOutButton } from "@/components/SignOutButton";
import { prisma } from "@/lib/db";
import { CalendarCheck, Compass, Map, Sparkles } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [bookings, trips] = await Promise.all([
    prisma.booking.count({ where: { travelerId: session.user.id } }),
    prisma.itinerary.count({ where: { travelerId: session.user.id } }),
  ]);

  const name = session.user.name || "Explorer";
  const initial = name.charAt(0).toUpperCase();

  const links = [
    { href: "/explore", label: "Explore", hint: "Places and small businesses", icon: Compass },
    { href: "/copilot", label: "Copilot", hint: "Plan a trip", icon: Sparkles },
    { href: "/bookings", label: "Bookings", hint: `${bookings} request${bookings === 1 ? "" : "s"}`, icon: CalendarCheck },
    { href: "/trips", label: "Trips", hint: `${trips} saved`, icon: Map },
  ];

  return (
    <Providers>
      <AppShell role={session.user.role}>
        <div className="mx-auto w-full max-w-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zim-green text-xl font-bold text-white ring-2 ring-zim-red/70 ring-offset-2">
              {initial}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[1.7rem] font-bold leading-tight tracking-tight">{name}</h1>
              <p className="truncate text-sm text-muted">{session.user.email}</p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-black/[0.06]">
            {links.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    index > 0 ? "border-t border-black/[0.05]" : ""
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04]">
                    <Icon className="h-4 w-4 text-zim-green" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="block truncate text-xs text-muted">{item.hint}</span>
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-8">
            <SignOutButton />
          </div>
        </div>
      </AppShell>
    </Providers>
  );
}
