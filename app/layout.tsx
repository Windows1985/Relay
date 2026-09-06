import type { Metadata, Viewport } from "next";
import { Martian_Mono } from "next/font/google";
import "./globals.css";

// Segmented-display character for numerals, timers, and the wordmark — the
// "hardware" register of the direction. Body/labels use the system stack:
// Operate-mode surfaces are explicitly licensed to skip a display webfont
// where a workhorse face reads fine, and the panel-hardware language does
// its work through layout and color, not typography, everywhere else.
const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

export const metadata: Metadata = {
  title: "Relay",
  description: "One nightly minigame for your group chat.",
};

export const viewport: Viewport = {
  themeColor: "#0b0d0a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${martianMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
