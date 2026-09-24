import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { CopilotChat } from "@/components/CopilotChat";
import { Providers } from "@/components/Providers";

export default async function CopilotPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <Providers>
      <AppShell role={session?.user?.role ?? "TRAVELER"}>
        <div className="flex h-[calc(100dvh-10.5rem)] min-h-0 flex-col md:h-[calc(100dvh-5.5rem)]">
          <CopilotChat signedIn={!!session?.user} firstName={firstName} />
        </div>
      </AppShell>
    </Providers>
  );
}
