import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NziraIQ — Discover Zimbabwe",
  description:
    "AI-powered tourism for Zimbabwe: plan trips, book local experiences, and grow the sector with intelligence.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
