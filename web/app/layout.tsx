import type { Metadata } from "next";
import { Inter_Tight, DM_Sans, Roboto_Mono } from "next/font/google";
import "./globals.css";

const display = Inter_Tight({ subsets: ["latin"], weight: ["500"], variable: "--font-display" });
const sans = DM_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-sans" });
const mono = Roboto_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Floor — downside coverage that cannot be liquidated",
  description: "Cap the downside on your spot position with dreamDEX Event Contracts on Somnia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
