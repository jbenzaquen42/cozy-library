"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Library,
  ScanLine,
  House,
  MapPin,
  Users,
  ArrowUpDown,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/catalog", label: "Catalog", icon: Library },
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/house", label: "House", icon: House },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/loans", label: "Loans", icon: Users },
  { href: "/import-export", label: "Import / Export", icon: ArrowUpDown },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 flex h-screen w-64 flex-col border-r border-warm-border bg-cream p-6">
      <div className="mb-8">
        <span className="block font-heading text-2xl font-bold text-deep-brown">
          Cozy Library
        </span>
        <p className="mt-1 text-xs text-muted-text">Home bookshelf locator</p>
      </div>
      <ul className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-baby-blue/40 text-deep-brown"
                    : "text-muted-text hover:bg-cream-dark hover:text-deep-brown"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
