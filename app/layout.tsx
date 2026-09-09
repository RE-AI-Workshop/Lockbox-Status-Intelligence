import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const sans = localFont({
  src: "../public/fonts/dm-sans-latin-wght-normal.woff2",
  variable: "--font-sans",
  weight: "100 1000",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Throughline",
  description: "Showings, contracts, and lockboxes on a sample market",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
