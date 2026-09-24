"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-zim-black text-white hover:bg-black/90 active:scale-[0.98] shadow-sm",
  secondary:
    "bg-white text-zim-black border border-zim-black/80 hover:bg-zim-white active:scale-[0.98]",
  ghost: "bg-transparent text-zim-black hover:bg-black/5",
  danger: "bg-zim-red text-white hover:bg-red-700",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  href?: string;
  children: ReactNode;
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  href,
  children,
  className,
  fullWidth,
  ...props
}: Props) {
  const classes = cn(
    "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    fullWidth && "w-full",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
