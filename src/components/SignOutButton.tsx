"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/welcome" })}
      className="w-full rounded-full border border-zim-black/80 px-6 py-3.5 text-[15px] font-semibold"
    >
      Sign out
    </button>
  );
}
