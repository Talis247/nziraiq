"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function OperatorBookingActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(status: "CONFIRMED" | "DECLINED") {
    setLoading(true);
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
      <Button
        disabled={loading}
        onClick={() => update("CONFIRMED")}
        className="w-full sm:min-w-[7.5rem] sm:w-auto"
      >
        Confirm
      </Button>
      <Button
        disabled={loading}
        variant="secondary"
        onClick={() => update("DECLINED")}
        className="w-full sm:w-auto"
      >
        Decline
      </Button>
    </div>
  );
}
