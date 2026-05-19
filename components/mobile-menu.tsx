"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MapPin, Users, ArrowLeftRight, Settings, X } from "lucide-react";

const menuItems = [
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/loans", label: "Loans", icon: Users },
  { href: "/import-export", label: "Import/Export", icon: ArrowLeftRight },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <div
        className="absolute inset-0 bg-deep-brown/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute bottom-20 left-4 right-4 rounded-3xl border border-warm-border bg-cream p-4 shadow-2xl shadow-amber-shadow/20">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-sm font-semibold text-muted-text">More</p>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-cream-dark"
          >
            <X className="h-5 w-5 text-muted-text" />
          </button>
        </div>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
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
      </div>
    </div>
  );
}
