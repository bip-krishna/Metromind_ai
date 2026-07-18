import type { Metadata } from "next";
import { Newsreader, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "MetroMind AI — Kochi Metro Operations",
  description: "Real-time operations twin for the Kochi Metro. Observe network state, predict pressure, recommend action.",
  openGraph: {
    title: "MetroMind AI — Kochi Metro Operations",
    description: "Real-time operations twin for the Kochi Metro."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${newsreader.variable} ${geistMono.variable}`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:inset-x-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[#111] focus:px-4 focus:py-3 focus:text-center focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
