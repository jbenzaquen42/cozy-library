import type { Metadata } from "next";
import { Crimson_Pro, Nunito } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cozy Home Library",
  description: "A home bookshelf locator and physical book catalog.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${crimsonPro.variable} ${nunito.variable}`}>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-2xl focus:bg-deep-brown focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-cream focus:shadow-xl focus:outline-none"
        >
          Skip to content
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
