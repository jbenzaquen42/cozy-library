"use client";

import { useState } from "react";
import { SideNav } from "./side-nav";
import { BottomNav } from "./bottom-nav";
import { MobileMenu } from "./mobile-menu";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-parchment md:flex-row">
      <aside className="hidden md:block">
        <SideNav />
      </aside>

      <main className="flex-1 px-4 py-6 pb-24 sm:px-6 md:px-8 md:pb-8">
        {children}
      </main>

      <BottomNav onMenuOpen={() => setMobileMenuOpen(true)} />
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}
