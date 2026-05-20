"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { HouseBrowserCopy, HouseBrowserLevel, HouseBrowserSlot } from "@/lib/db/houseBrowser";
import { countCopies, countOccupiedSlots, countSlots, flattenShelfOptions, getBoundedShelfIndex, getShelfOccupancyPercent, getVisibleRowCopies, type ShelfOption } from "@/lib/scene/livingRoomBrowser";

const SPINE_PALETTE = ["#7d8f65", "#b99068", "#6b4a34", "#8a6548", "#5c7a6b", "#a85d5d", "#4f6b8b", "#9f775a", "#d4a76a"];

export function LivingRoomBookshelfBrowser({ levels }: { levels: HouseBrowserLevel[] }) {
  const shelfOptions = useMemo(() => flattenShelfOptions(levels), [levels]);
  const defaultIndex = useMemo(() => Math.max(0, shelfOptions.findIndex((option) => option.shelf.sceneKey.includes("downstairs.entry"))), [shelfOptions]);
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [hasNavigated, setHasNavigated] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const boundedActiveIndex = getBoundedShelfIndex(shelfOptions.length, activeIndex);

  useEffect(() => {
    if (!shelfOptions.length) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setHasNavigated(true);
        setDirection("next");
        setActiveIndex((current) => (current + 1) % shelfOptions.length);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setHasNavigated(true);
        setDirection("previous");
        setActiveIndex((current) => (current - 1 + shelfOptions.length) % shelfOptions.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shelfOptions.length]);

  if (!shelfOptions.length) {
    return (
      <section className="rounded-[2rem] border border-warm-border bg-cream p-8 text-deep-brown shadow-xl shadow-amber-shadow/10">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-text">Living room shelf wall</p>
        <h1 className="mt-3 font-heading text-4xl">No bookshelves yet</h1>
        <p className="mt-3 max-w-2xl text-muted-text">Create shelves from Locations first, then this room view will place the active bookshelf in the center of the room.</p>
        <Link href="/locations" className="mt-5 inline-flex rounded-full bg-deep-brown px-5 py-2 text-sm font-semibold text-cream">Open locations</Link>
      </section>
    );
  }

  const activeOption = shelfOptions[boundedActiveIndex] ?? shelfOptions[0]!;
  const copyCount = countCopies(activeOption.shelf);
  const slotCount = countSlots(activeOption.shelf);
  const occupiedSlotCount = countOccupiedSlots(activeOption.shelf);
  const occupancyPercent = getShelfOccupancyPercent(activeOption.shelf);

  function selectShelf(nextIndex: number) {
    if (nextIndex === boundedActiveIndex) return;
    setHasNavigated(true);
    setDirection(nextIndex > boundedActiveIndex ? "next" : "previous");
    setActiveIndex(nextIndex);
  }

  function goToNext() {
    setHasNavigated(true);
    setDirection("next");
    setActiveIndex((current) => (current + 1) % shelfOptions.length);
  }

  function goToPrevious() {
    setHasNavigated(true);
    setDirection("previous");
    setActiveIndex((current) => (current - 1 + shelfOptions.length) % shelfOptions.length);
  }

  function handleShelfPointerUp(clientX: number) {
    if (swipeStartX.current === null) return;
    const deltaX = clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(deltaX) < 56) return;
    if (deltaX < 0) goToNext();
    else goToPrevious();
  }

  return (
    <section className="relative isolate overflow-hidden rounded-[2.5rem] border border-warm-border bg-[#ecd3ad] text-deep-brown shadow-2xl shadow-amber-shadow/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_16%,rgba(255,250,240,.82),transparent_27%),linear-gradient(180deg,#f8e7c9_0%,#e5bd86_58%,#7b5135_58%,#5b3927_100%)]" />
      <div className="absolute inset-x-0 bottom-[33%] h-4 bg-[#d8aa73] shadow-[0_12px_28px_rgba(79,52,34,.25)]" />
      <div className="absolute left-7 top-8 hidden h-36 w-24 rounded-t-full border-[10px] border-[#b99068] bg-gradient-to-b from-baby-blue to-cream shadow-inner md:block" />
      <div className="absolute bottom-[34%] left-[7%] hidden h-20 w-52 rounded-[2rem_2rem_.8rem_.8rem] bg-[#7d8f65]/75 shadow-xl md:block" />
      <div className="absolute bottom-[30%] left-[10%] hidden h-10 w-44 rounded-b-3xl bg-[#5f704f] md:block" />
      <div className="absolute bottom-[10%] left-1/2 h-24 w-[52rem] -translate-x-1/2 rounded-[50%] bg-[#9f775a]/20 blur-sm" />
      <div className="absolute bottom-[8%] left-1/2 h-20 w-[42rem] -translate-x-1/2 rounded-[50%] border border-cream/35 bg-[#c78355]/35" />

      <div className="relative grid min-h-[43rem] gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:p-8">
        <div className="flex min-h-[39rem] flex-col justify-between">
          <div className="max-w-3xl rounded-3xl border border-cream/60 bg-cream/75 p-5 shadow-lg shadow-amber-shadow/10 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-muted-text">Straight-on room view</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div aria-live="polite" aria-atomic="true">
                <h2 className="font-heading text-4xl leading-none sm:text-5xl">{activeOption.shelf.name}</h2>
                <p className="mt-2 text-sm font-semibold text-muted-text">{activeOption.locationLabel} · {activeOption.shelf.rowCount} shelves · {copyCount} copies · {occupiedSlotCount}/{slotCount} occupied slots</p>
              </div>
              <div className="rounded-full border border-warm-border bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-text">
                {boundedActiveIndex + 1} / {shelfOptions.length}
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-full border border-warm-border bg-white/65" role="progressbar" aria-label={`${activeOption.shelf.name} occupancy`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={occupancyPercent}>
              <div className="h-2 rounded-full bg-sage transition-[width] duration-300" style={{ width: `${occupancyPercent}%` }} />
            </div>
          </div>

          <div
            className="relative flex flex-1 touch-pan-y items-center justify-center px-4 py-8"
            role="region"
            aria-label="Bookshelf swipe area"
            onPointerDown={(event) => {
              if (event.pointerType === "mouse") return;
              swipeStartX.current = event.clientX;
            }}
            onPointerCancel={() => {
              swipeStartX.current = null;
            }}
            onPointerUp={(event) => handleShelfPointerUp(event.clientX)}
          >
            <button type="button" aria-label="Previous bookshelf" onClick={goToPrevious} className="absolute left-0 z-20 grid h-12 w-12 place-items-center rounded-full border border-cream/60 bg-cream/90 text-3xl shadow-lg transition hover:-translate-x-1 hover:bg-white focus:outline-none focus:ring-4 focus:ring-sage/35">
              ‹
            </button>
            <ActiveBookshelf key={activeOption.shelf.id} option={activeOption} direction={direction} animate={hasNavigated} />
            <button type="button" aria-label="Next bookshelf" onClick={goToNext} className="absolute right-0 z-20 grid h-12 w-12 place-items-center rounded-full border border-cream/60 bg-cream/90 text-3xl shadow-lg transition hover:translate-x-1 hover:bg-white focus:outline-none focus:ring-4 focus:ring-sage/35">
              ›
            </button>
          </div>
        </div>

        <aside className="relative z-30 rounded-[2rem] border border-cream/70 bg-cream/90 p-4 shadow-xl shadow-amber-shadow/15 backdrop-blur lg:self-stretch">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-muted-text">Shelf switcher</p>
              <h2 className="mt-1 font-heading text-2xl">Your bookcases</h2>
            </div>
            <div className="rounded-full bg-sage/20 px-3 py-1 text-xs font-bold text-deep-brown">← →</div>
          </div>
          <div className="mt-4 grid max-h-[34rem] gap-2 overflow-y-auto pr-1">
            {shelfOptions.map((option, index) => (
              <ShelfSwitcherButton
                key={option.shelf.id}
                option={option}
                index={index}
                selected={index === boundedActiveIndex}
                onSelect={() => selectShelf(index)}
              />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl border border-warm-border bg-white/70 p-3">
              <span className="block font-black uppercase tracking-wide text-muted-text">Copies</span>
              <span className="mt-1 block font-heading text-2xl text-deep-brown">{copyCount}</span>
            </div>
            <div className="rounded-2xl border border-warm-border bg-white/70 p-3">
              <span className="block font-black uppercase tracking-wide text-muted-text">Slots used</span>
              <span className="mt-1 block font-heading text-2xl text-deep-brown">{occupancyPercent}%</span>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-warm-border bg-white/70 p-3 text-xs leading-5 text-muted-text">
            Swipe the bookshelf on touch screens, use keyboard arrows on desktop, or pick a bookcase from the switcher.
          </div>
        </aside>
      </div>
    </section>
  );
}

function ShelfSwitcherButton({ option, index, selected, onSelect }: { option: ShelfOption; index: number; selected: boolean; onSelect: () => void }) {
  const shelfCopyCount = countCopies(option.shelf);
  const shelfOccupancyPercent = getShelfOccupancyPercent(option.shelf);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group rounded-2xl border p-3 text-left transition duration-200 focus:outline-none focus:ring-4 focus:ring-sage/30 ${selected ? "border-deep-brown bg-deep-brown text-cream shadow-lg" : "border-warm-border bg-white/72 text-deep-brown hover:-translate-y-0.5 hover:bg-white"}`}
    >
      <span className="flex items-start gap-3">
        <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage/20 text-sm font-black group-hover:bg-sage/30">{index + 1}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-lg leading-tight">{option.shelf.name}</span>
          <span className={`mt-1 block text-xs ${selected ? "text-cream/75" : "text-muted-text"}`}>{option.locationLabel}</span>
          <span className={`mt-2 block text-xs font-semibold ${selected ? "text-cream/85" : "text-muted-text"}`}>{option.shelf.rowCount} shelves · {shelfCopyCount} copies</span>
          <span className={`mt-2 block h-1.5 overflow-hidden rounded-full ${selected ? "bg-cream/20" : "bg-warm-border"}`} role="progressbar" aria-label={`${option.shelf.name} occupancy`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={shelfOccupancyPercent}>
            <span className={`block h-full rounded-full ${selected ? "bg-cream" : "bg-sage"}`} style={{ width: `${shelfOccupancyPercent}%` }} />
          </span>
        </span>
      </span>
    </button>
  );
}

function ActiveBookshelf({ option, direction, animate }: { option: ShelfOption; direction: "next" | "previous"; animate: boolean }) {
  const shelf = option.shelf;
  const rows = Array.from({ length: Math.max(1, shelf.rowCount) }, (_, index) => index + 1);
  const animationClass = animate ? (direction === "next" ? "animate-[shelf-slide-next_360ms_cubic-bezier(.22,1,.36,1)]" : "animate-[shelf-slide-previous_360ms_cubic-bezier(.22,1,.36,1)]") : "";

  return (
    <div className={`relative z-10 w-[min(88vw,34rem)] ${animationClass}`}>
      <div className="absolute -inset-x-12 bottom-0 h-12 rounded-[50%] bg-deep-brown/25 blur-xl" />
      <div className="relative rounded-[1.8rem] border-[14px] border-[#6b4a34] bg-[#4f3422] p-3 shadow-[0_38px_80px_rgba(40,23,12,.42)]">
        <div className="absolute -top-8 left-1/2 h-7 w-32 -translate-x-1/2 rounded-t-3xl border border-[#7c5538] bg-[#8a6548]" />
        <div className="grid gap-2 rounded-xl bg-[#7a5438] p-2">
          {rows.map((rowIndex) => (
            <ShelfRow key={rowIndex} shelf={shelf} rowIndex={rowIndex} />
          ))}
        </div>
      </div>
      <div className="mx-auto mt-3 w-[82%] rounded-b-[2rem] bg-[#5c3b28] px-5 py-2 text-center text-xs font-bold uppercase tracking-[0.22em] text-cream/85 shadow-lg">
        {option.levelName} · {option.roomName}
      </div>
    </div>
  );
}

function ShelfRow({ shelf, rowIndex }: { shelf: ShelfOption["shelf"]; rowIndex: number }) {
  const { visible: visibleCopies, hiddenCount: hiddenCopyCount } = getVisibleRowCopies(shelf, rowIndex);

  return (
    <div className="relative min-h-24 rounded-lg border-b-[10px] border-[#5c3b28] bg-gradient-to-b from-[#b99068] to-[#8a6548] px-3 pb-2 pt-4 shadow-inner">
      <div className="flex h-[4.75rem] items-end gap-1 overflow-hidden">
        {visibleCopies.length ? (
          <>
            {visibleCopies.map(({ copy, slot, copyIndex }) => <BookSpine key={`${slot.id}-${copy.id}-${copyIndex}`} copy={copy} slot={slot} index={copyIndex} />)}
            {hiddenCopyCount ? <span className="mb-1 shrink-0 rounded-full bg-deep-brown/75 px-2 py-1 text-[10px] font-black text-cream shadow-sm" title={`${hiddenCopyCount} more book${hiddenCopyCount === 1 ? "" : "s"} hidden`} aria-label={`${hiddenCopyCount} more book${hiddenCopyCount === 1 ? "" : "s"} hidden in this row`}>+{hiddenCopyCount}</span> : null}
          </>
        ) : (
          <div className="grid h-full w-full place-items-center rounded border border-dashed border-cream/35 bg-cream/10 text-[10px] font-bold uppercase tracking-[0.18em] text-cream/70">Row {rowIndex}</div>
        )}
      </div>
      <span className="absolute right-2 top-2 rounded-full bg-deep-brown/55 px-2 py-0.5 text-[10px] font-bold text-cream/80">{rowIndex}</span>
    </div>
  );
}

function BookSpine({ copy, slot, index }: { copy: HouseBrowserCopy; slot: HouseBrowserSlot; index: number }) {
  const height = 34 + (stableHash(copy.id) % 26);
  const width = Math.max(20, 14 + (stableHash(copy.title) % 9));
  const color = SPINE_PALETTE[stableHash(`${copy.title}-${copy.id}`) % SPINE_PALETTE.length]!;
  const depthOffset = slot.depthIndex > 1 ? "opacity-70 -ml-1" : "";

  return (
    <Link
      href={`/books/${copy.bookId}`}
      title={`${copy.title} · ${copy.displayAuthor}`}
      className={`group relative shrink-0 rounded-t-sm border border-black/10 shadow-sm transition duration-200 hover:-translate-y-2 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-cream/50 ${depthOffset}`}
      style={{ height, width, backgroundColor: color, zIndex: slot.depthIndex === 1 ? 10 + index : index }}
    >
      <span className="absolute inset-y-1 left-1 w-px bg-white/30" />
      <span className="sr-only">Open {copy.title}</span>
    </Link>
  );
}

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
