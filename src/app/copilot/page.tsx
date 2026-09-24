import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { CopilotChat } from "@/components/CopilotChat";
import { Providers } from "@/components/Providers";

export default async function CopilotPage() {
  const session = await auth();

  return (
    <Providers>
      <AppShell role={session?.user?.role ?? "TRAVELER"}>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zim-gold">
            User layer
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">AI Copilot</h1>
          <p className="mt-2 max-w-xl text-muted">
            Plan personalized Zimbabwe trips through conversation — prices and stops come from the marketplace.
          </p>
        </div>
        <CopilotChat signedIn={!!session?.user} />
      </AppShell>
    </Providers>
  );
}
