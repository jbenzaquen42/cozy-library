"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function FlashBanner({ successMessage }: { successMessage?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialFlash = useMemo(() => {
    const error = searchParams.get("error");
    if (error) return { type: "error" as const, message: error };
    if (searchParams.has("saved")) return { type: "success" as const, message: successMessage ?? "Saved." };
    return null;
  }, [searchParams, successMessage]);
  const [flash, setFlash] = useState(initialFlash);

  useEffect(() => {
    if (!flash) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    const hadFlashParams = nextParams.has("error") || nextParams.has("saved");
    nextParams.delete("error");
    nextParams.delete("saved");

    if (hadFlashParams) {
      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [flash, pathname, router, searchParams]);

  if (!flash) return null;

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm font-semibold text-deep-brown",
        flash.type === "error" ? "border-soft-red/30 bg-soft-red/10" : "border-sage/30 bg-sage/10",
      )}
      role={flash.type === "error" ? "alert" : "status"}
    >
      <p>{flash.message}</p>
      <button
        type="button"
        onClick={() => setFlash(null)}
        className="flex min-h-10 min-w-10 items-center justify-center rounded-full px-2 text-lg leading-none text-muted-text hover:bg-white/50 hover:text-deep-brown"
        aria-label="Dismiss message"
      >
        ×
      </button>
    </div>
  );
}
