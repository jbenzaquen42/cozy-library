"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectedShelfPanel } from "@/components/house/SelectedShelfPanel";
import type { HouseBrowserLevel, HouseBrowserShelf } from "@/lib/db/houseBrowser";

type DepthView = "front" | "back";

type MapShelf = {
  sceneKey: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const MAP_SHELVES: MapShelf[] = [
  { sceneKey: "shelf.downstairs.entry.entry-shelf", label: "Entry Shelf", x: 58, y: 108, width: 86, height: 24 },
  { sceneKey: "shelf.upstairs.hallway.bookcase-1", label: "Hallway 1", x: 284, y: 78, width: 64, height: 24 },
  { sceneKey: "shelf.upstairs.hallway.bookcase-2", label: "Hallway 2", x: 354, y: 78, width: 64, height: 24 },
  { sceneKey: "shelf.upstairs.hallway.bookcase-3", label: "Hallway 3", x: 424, y: 78, width: 64, height: 24 },
  { sceneKey: "shelf.upstairs.study.study-shelf", label: "Study Shelf", x: 558, y: 180, width: 86, height: 24 },
];

export function House2DBrowser({ levels }: { levels: HouseBrowserLevel[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shelves = useMemo(() => levels.flatMap((level) => level.rooms.flatMap((room) => room.shelves)), [levels]);
  const shelfParam = searchParams.get("shelf");
  const selectedShelf = shelves.find((shelf) => shelf.sceneKey === shelfParam) ?? shelves[0] ?? null;
  const [depthView, setDepthView] = useState<DepthView>(searchParams.get("depth") === "back" ? "back" : "front");

  function selectShelf(sceneKey: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("shelf", sceneKey);
    params.set("depth", depthView);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function selectDepth(depth: DepthView) {
    setDepthView(depth);
    const params = new URLSearchParams(searchParams.toString());
    if (selectedShelf) params.set("shelf", selectedShelf.sceneKey);
    params.set("depth", depth);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <Card variant="blue" title="House map">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-text">Click a shelf on the SVG map. Selection is stored in the URL.</p>
            <div className="flex gap-2" aria-label="Depth view">
              <Button type="button" size="sm" variant={depthView === "front" ? "primary" : "outline"} onClick={() => selectDepth("front")}>
                Front depth
              </Button>
              <Button type="button" size="sm" variant={depthView === "back" ? "primary" : "outline"} onClick={() => selectDepth("back")}>
                Back depth
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-warm-border bg-cream">
            <svg viewBox="0 0 720 320" role="img" aria-label="2D house map with clickable bookshelves" className="h-auto w-full">
              <rect x="24" y="44" width="184" height="206" rx="20" fill="#f8ecd2" stroke="#c9a987" strokeWidth="3" />
              <text x="48" y="78" className="fill-deep-brown text-sm font-semibold">Downstairs entry</text>
              <path d="M98 250 C106 222 128 222 136 250" fill="none" stroke="#c9a987" strokeWidth="3" />

              <rect x="250" y="44" width="278" height="148" rx="20" fill="#eef6f8" stroke="#9cc5cf" strokeWidth="3" />
              <text x="274" y="72" className="fill-deep-brown text-sm font-semibold">Upstairs hallway</text>
              <line x1="250" y1="192" x2="528" y2="192" stroke="#9cc5cf" strokeWidth="3" strokeDasharray="8 8" />

              <rect x="538" y="116" width="150" height="146" rx="20" fill="#fdebf1" stroke="#e7b3c5" strokeWidth="3" />
              <text x="562" y="150" className="fill-deep-brown text-sm font-semibold">Study</text>

              {MAP_SHELVES.map((mapShelf) => {
                const shelf = shelves.find((item) => item.sceneKey === mapShelf.sceneKey);
                if (!shelf) return null;
                const selected = selectedShelf?.sceneKey === shelf.sceneKey;
                const copyCount = shelf.slots.reduce((total, slot) => total + slot.copies.length, 0);
                return (
                  <g key={mapShelf.sceneKey}>
                    <rect
                      x={mapShelf.x}
                      y={mapShelf.y}
                      width={mapShelf.width}
                      height={mapShelf.height}
                      rx="8"
                      role="button"
                      tabIndex={0}
                      aria-label={`Select ${shelf.name}`}
                      onClick={() => selectShelf(shelf.sceneKey)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") selectShelf(shelf.sceneKey);
                      }}
                      className="cursor-pointer outline-none transition-opacity hover:opacity-80"
                      fill={selected ? "#a8d5ba" : "#b99068"}
                      stroke={selected ? "#567760" : "#7b553b"}
                      strokeWidth={selected ? "4" : "2"}
                    />
                    <text x={mapShelf.x + 8} y={mapShelf.y + 16} className="pointer-events-none fill-deep-brown text-[10px] font-bold">
                      {mapShelf.label}
                    </text>
                    <text x={mapShelf.x + 8} y={mapShelf.y + 38} className="pointer-events-none fill-muted-text text-[9px]">
                      {copyCount} copies
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>

        <SelectedShelfGrid shelf={selectedShelf} depthView={depthView} />
      </div>

      <SelectedShelfPanel shelf={selectedShelf} />
    </div>
  );
}

function SelectedShelfGrid({ shelf, depthView }: { shelf: HouseBrowserShelf | null; depthView: DepthView }) {
  if (!shelf) {
    return (
      <Card variant="cream" title="Row grid">
        <p className="text-sm text-muted-text">No shelf selected.</p>
      </Card>
    );
  }

  const depthIndex = depthView === "front" ? 1 : Math.min(2, shelf.depthCount);

  return (
    <Card variant="white" title={`${shelf.name} row grid`}>
      <div className="space-y-3">
        <p className="text-sm text-muted-text">
          Showing {depthIndex === 1 ? "front" : "back"} depth. Empty shelf slots remain visible.
        </p>
        <div className="grid gap-3">
          {Array.from({ length: shelf.rowCount }).map((_, index) => {
            const rowIndex = index + 1;
            const slot = shelf.slots.find((item) => item.rowIndex === rowIndex && item.depthIndex === depthIndex);
            return (
              <div key={rowIndex} className="rounded-2xl border border-warm-border bg-cream/70 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-deep-brown">Row {rowIndex}</p>
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-muted-text">{slot?.copies.length ?? 0} books</span>
                </div>
                {slot && slot.copies.length > 0 ? (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {slot.copies.map((copy) => (
                      <li key={copy.id} className="rounded-xl bg-white/75 p-2 text-sm">
                        <a href={`/books/${copy.bookId}`} className="font-semibold text-deep-brown underline-offset-2 hover:underline">
                          {copy.title}
                        </a>
                        <p className="text-xs text-muted-text">Copy {copy.copyLabel} · {copy.displayAuthor}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-text">Empty slot</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
