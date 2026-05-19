"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Library, ScanLine, House, Menu } from "lucide-react";

const primaryItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/catalog", label: "Catalog", icon: Library },
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/house", label: "House", icon: House },
];

export function BottomNav({ onMenuOpen }: { onMenuOpen: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-warm-border bg-cream pt-2 pb-3 md:hidden">
      <ul className="flex items-center justify-around">
        {primaryItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold transition-colors",
                  isActive ? "text-deep-brown" : "text-muted-text"
                )}
              >
                <item.icon
                  className={cn("h-6 w-6", isActive && "text-sage")}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            onClick={onMenuOpen}
            className="flex w-full flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-muted-text transition-colors"
          >
            <Menu className="h-6 w-6" />
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
