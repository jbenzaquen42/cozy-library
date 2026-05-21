"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { HouseBrowserCopy, HouseBrowserLevel, HouseBrowserSlot, HouseBrowserUnshelvedCopy } from "@/lib/db/houseBrowser";
import { countCopies, countOccupiedSlots, countSlots, flattenShelfOptions, getBoundedShelfIndex, getShelfOccupancyPercent, getVisibleRowCopies, type ShelfOption } from "@/lib/scene/livingRoomBrowser";
import { moveCopyInHouseAction, updateBookSpineColorAction, updateViewerBookshelfAction } from "@/app/house/actions";
import { CozyViewerSettingsControls, useCozyViewerSettings } from "@/components/house/cozyViewerSettings";
import { useCozySounds } from "@/components/house/useCozySounds";

const SPINE_PALETTE = ["#7d8f65", "#b99068", "#6b4a34", "#8a6548", "#5c7a6b", "#a85d5d", "#4f6b8b", "#9f775a", "#d4a76a"];
const DEFAULT_FRAME = "#6b4a34";
const DEFAULT_SHELF = "#8a6548";
const DEFAULT_TRIM = "#5c3b28";
const FIRST_VISIT_KEY = "cozy-library.first-visit-note.dismissed";

type MoveStatus = { tone: "good" | "bad" | "info"; message: string } | null;
type SearchMatch = {
  copy: HouseBrowserCopy;
  shelfIndex: number | null;
  shelfName: string;
  locationLabel: string;
  rowLabel: string;
};

export function LivingRoomBookshelfBrowser({ levels, unshelvedCopies }: { levels: HouseBrowserLevel[]; unshelvedCopies: HouseBrowserUnshelvedCopy[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const shelfOptions = useMemo(() => flattenShelfOptions(levels), [levels]);
  const defaultIndex = useMemo(() => Math.max(0, shelfOptions.findIndex((option) => option.shelf.sceneKey.includes("downstairs.entry"))), [shelfOptions]);
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [hasNavigated, setHasNavigated] = useState(false);
  const [selectedCopyId, setSelectedCopyId] = useState<string | null>(null);
  const [detailCopyId, setDetailCopyId] = useState<string | null>(null);
  const [editingShelf, setEditingShelf] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => (typeof window === "undefined" ? true : window.localStorage.getItem(FIRST_VISIT_KEY) === "true"));
  const [mobileShelvesOpen, setMobileShelvesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<MoveStatus>(null);
  const [viewMode, setViewMode] = useState<"detail" | "overview">("detail");
  const [arrangeMode, setArrangeMode] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const { settings, setSettings, resetSettings } = useCozyViewerSettings();
  const playCozySound = useCozySounds(settings);
  const boundedActiveIndex = getBoundedShelfIndex(shelfOptions.length, activeIndex);
  const activeOption = shelfOptions[boundedActiveIndex] ?? shelfOptions[0];
  const selectedCopy = activeOption ? findCopy(activeOption.shelf.slots, selectedCopyId) ?? unshelvedCopies.find((copy) => copy.id === selectedCopyId) ?? null : null;
  const detailCopy = activeOption ? findCopy(activeOption.shelf.slots, detailCopyId) ?? unshelvedCopies.find((copy) => copy.id === detailCopyId) ?? null : null;
  const searchMatches = useMemo(() => findSearchMatches(shelfOptions, unshelvedCopies, searchQuery), [shelfOptions, unshelvedCopies, searchQuery]);

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
      if (event.key === "Escape") {
        setDetailCopyId(null);
        setSelectedCopyId(null);
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

  const copyCount = countCopies(activeOption.shelf);
  const slotCount = countSlots(activeOption.shelf);
  const occupiedSlotCount = countOccupiedSlots(activeOption.shelf);
  const occupancyPercent = getShelfOccupancyPercent(activeOption.shelf);

  function selectShelf(nextIndex: number) {
    if (nextIndex === boundedActiveIndex) return;
    playCozySound("shelf");
    setHasNavigated(true);
    setDirection(nextIndex > boundedActiveIndex ? "next" : "previous");
    setActiveIndex(nextIndex);
    setViewMode("detail");
    setMobileShelvesOpen(false);
    setSelectedCopyId(null);
    setDetailCopyId(null);
  }

  function goToNext() {
    playCozySound("shelf");
    setHasNavigated(true);
    setDirection("next");
    setActiveIndex((current) => (current + 1) % shelfOptions.length);
    setSelectedCopyId(null);
    setDetailCopyId(null);
  }

  function goToPrevious() {
    playCozySound("shelf");
    setHasNavigated(true);
    setDirection("previous");
    setActiveIndex((current) => (current - 1 + shelfOptions.length) % shelfOptions.length);
    setSelectedCopyId(null);
    setDetailCopyId(null);
  }

  function handleShelfPointerUp(clientX: number) {
    if (swipeStartX.current === null) return;
    const deltaX = clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(deltaX) < 56) return;
    if (deltaX < 0) goToNext();
    else goToPrevious();
  }

  function chooseBook(copy: HouseBrowserCopy) {
    playCozySound("book");
    if (selectedCopyId === copy.id) {
      setDetailCopyId(copy.id);
      return;
    }
    setSelectedCopyId(copy.id);
    setDetailCopyId(null);
    setStatus({ tone: "info", message: "Now choose a shelf spot, or tap this book again for a closer look." });
  }

  function moveCopy(copyId: string, targetSlotId: string | null, targetPosition?: number | null) {
    playCozySound("move");
    startTransition(async () => {
      const result = await moveCopyInHouseAction(copyId, targetSlotId, targetPosition ?? null);
      setStatus({ tone: result.ok ? "good" : "bad", message: result.message });
      if (result.ok) {
        setSelectedCopyId(null);
        setDetailCopyId(null);
        router.refresh();
      }
    });
  }

  function saveShelf(formData: FormData) {
    startTransition(async () => {
      const result = await updateViewerBookshelfAction(formData);
      setStatus({ tone: result.ok ? "good" : "bad", message: result.message });
      if (result.ok) {
        setEditingShelf(false);
        router.refresh();
      }
    });
  }

  function saveColor(copyId: string, color: string) {
    startTransition(async () => {
      const result = await updateBookSpineColorAction(copyId, color);
      setStatus({ tone: result.ok ? "good" : "bad", message: result.message });
      if (result.ok) router.refresh();
    });
  }

  function selectSearchMatch(match: SearchMatch) {
    playCozySound("book");
    if (match.shelfIndex !== null) {
      setHasNavigated(true);
      setDirection(match.shelfIndex > boundedActiveIndex ? "next" : "previous");
      setActiveIndex(match.shelfIndex);
    }
    setSelectedCopyId(match.copy.id);
    setDetailCopyId(null);
    setStatus({ tone: "good", message: `${match.copy.title} is on ${match.shelfName} (${match.locationLabel})${match.rowLabel ? ` · ${match.rowLabel}` : ""}.` });
  }

  function dismissOnboarding() {
    window.localStorage.setItem(FIRST_VISIT_KEY, "true");
    setOnboardingDismissed(true);
  }

  return (
    <section className={`relative isolate overflow-hidden rounded-[2.5rem] border text-deep-brown shadow-2xl shadow-amber-shadow/20 ${arrangeMode ? "border-amber-600/60 bg-[#ecd3ad] ring-2 ring-amber-500/20" : "border-warm-border bg-[#ecd3ad]"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(255,250,240,.9),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(246,199,215,.42),transparent_20%),linear-gradient(180deg,#f8e7c9_0%,#e5bd86_58%,#7b5135_58%,#5b3927_100%)]" />
      <div className="absolute inset-x-0 bottom-[33%] h-4 bg-[#d8aa73] shadow-[0_12px_28px_rgba(79,52,34,.25)]" />
      <div className="absolute left-7 top-8 hidden h-36 w-24 rounded-t-full border-[10px] border-[#b99068] bg-gradient-to-b from-baby-blue to-cream shadow-inner md:block" />
      <div className="absolute right-10 top-10 hidden rounded-full border border-cream/60 bg-cream/70 px-4 py-2 text-2xl shadow-lg md:block">☕</div>
      <div className="absolute left-1/2 top-8 hidden -translate-x-1/2 rounded-full border border-cream/60 bg-cream/60 px-5 py-2 text-sm font-black text-muted-text shadow-lg md:block">🌿 cozy shelf finder 🌿</div>
      <div className="absolute bottom-[34%] left-[7%] hidden h-20 w-52 rounded-[2rem_2rem_.8rem_.8rem] bg-[#7d8f65]/75 shadow-xl md:block" />
      <div className="absolute bottom-[30%] left-[10%] hidden h-10 w-44 rounded-b-3xl bg-[#5f704f] md:block" />
      <div className="absolute bottom-[10%] left-1/2 h-24 w-[52rem] -translate-x-1/2 rounded-[50%] bg-[#9f775a]/20 blur-sm" />
      <div className="absolute bottom-[8%] left-1/2 h-20 w-[42rem] -translate-x-1/2 rounded-[50%] border border-cream/35 bg-[#c78355]/35" />

      <div className="relative grid min-h-[43rem] gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:p-8">
        <div className="flex min-h-[39rem] flex-col justify-between">
          <div className="max-w-3xl rounded-3xl border border-cream/60 bg-cream/80 p-5 shadow-lg shadow-amber-shadow/10 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-muted-text">Your bookcases</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/catalog" className="rounded-full border border-warm-border bg-white/80 px-3 py-1 text-xs font-bold text-deep-brown transition hover:bg-white">Search catalog</Link>
                <button type="button" onClick={() => setHelpOpen((value) => !value)} className="min-h-10 rounded-full border border-warm-border bg-white/80 px-3 py-1 text-xs font-bold text-deep-brown transition hover:bg-white">How it works</button>
                <button type="button" onClick={() => setSettingsOpen((value) => !value)} className="rounded-full border border-warm-border bg-white/80 px-3 py-1 text-xs font-bold text-deep-brown transition hover:bg-white">Settings</button>
                <button type="button" onClick={() => setViewMode((value) => (value === "detail" ? "overview" : "detail"))} className={`rounded-full border px-3 py-1 text-xs font-bold shadow-sm transition hover:-translate-y-0.5 ${viewMode === "overview" ? "border-sage bg-sage text-cream" : "border-deep-brown bg-deep-brown text-cream"}`} aria-pressed={viewMode === "overview"}>
                  {viewMode === "overview" ? "One bookcase" : "All bookcases"}
                </button>
                <button type="button" onClick={() => setArrangeMode((value) => !value)} className={`rounded-full border px-3 py-1 text-xs font-bold shadow-sm transition hover:-translate-y-0.5 ${arrangeMode ? "border-amber-600 bg-amber-600 text-cream" : "border-warm-border bg-white/80 text-deep-brown hover:bg-white"}`} aria-pressed={arrangeMode}>
                  {arrangeMode ? "Arrange: on" : "Arrange books"}
                </button>
                <button type="button" onClick={() => setEditingShelf((value) => !value)} className="rounded-full border border-deep-brown bg-deep-brown px-3 py-1 text-xs font-bold text-cream shadow-sm transition hover:-translate-y-0.5">Edit shelf</button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div aria-live="polite" aria-atomic="true">
                <h2 className="font-heading text-4xl leading-none sm:text-5xl">{activeOption.shelf.name}</h2>
                <p className="mt-2 text-sm font-semibold text-muted-text">({activeOption.locationLabel}) · {activeOption.shelf.rowCount} shelves · {copyCount} copies · {occupiedSlotCount}/{slotCount} filled spots</p>
              </div>
              <div className="rounded-full border border-warm-border bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-text">
                {boundedActiveIndex + 1} / {shelfOptions.length}
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-full border border-warm-border bg-white/65" role="progressbar" aria-label={`${activeOption.shelf.name} occupancy`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={occupancyPercent}>
              <div className="h-2 rounded-full bg-sage transition-[width] duration-300" style={{ width: `${occupancyPercent}%` }} />
            </div>
            {!onboardingDismissed ? <FirstVisitNote onDismiss={dismissOnboarding} /> : null}
            {helpOpen ? <ShelfHelpCard /> : null}
            <ViewerSearch query={searchQuery} matches={searchMatches} onQueryChange={setSearchQuery} onSelect={selectSearchMatch} />
            {status ? <div className={`mt-3 rounded-2xl px-4 py-2 text-sm font-semibold ${status.tone === "bad" ? "bg-soft-red/15 text-[#8d2f2f]" : status.tone === "good" ? "bg-sage/20 text-deep-brown" : "bg-white/70 text-muted-text"}`}>{status.message}</div> : null}
            {settingsOpen ? <CozyViewerSettingsControls settings={settings} onChange={setSettings} onReset={resetSettings} compact /> : null}
            {editingShelf ? <ShelfEditForm option={activeOption} pending={isPending} onSave={saveShelf} /> : null}
          </div>

          <div
            className="relative flex flex-1 touch-pan-y items-center justify-center px-1 py-8 sm:px-4"
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
            {viewMode === "overview" ? (
              <BookcasesOverview
                shelfOptions={shelfOptions}
                onSelectBookcase={(index) => {
                  setActiveIndex(index);
                  setViewMode("detail");
                  setHasNavigated(true);
                  setSelectedCopyId(null);
                  setDetailCopyId(null);
                }}
              />
            ) : (
              <>
                <button type="button" aria-label="Previous bookshelf" onClick={goToPrevious} className="absolute left-0 z-20 grid h-12 w-12 place-items-center rounded-full border border-cream/60 bg-cream/90 text-3xl shadow-lg transition hover:-translate-x-1 hover:bg-white focus:outline-none focus:ring-4 focus:ring-sage/35">
                  ‹
                </button>
                <ActiveBookshelf
                  key={activeOption.shelf.id}
                  option={activeOption}
                  direction={direction}
                  animate={hasNavigated}
                  selectedCopyId={selectedCopyId}
                  detailCopyId={detailCopyId}
                  pending={isPending}
                  arrangeMode={arrangeMode}
                  onChooseBook={chooseBook}
                  onMoveCopy={moveCopy}
                />
                <button type="button" aria-label="Next bookshelf" onClick={goToNext} className="absolute right-0 z-20 grid h-12 w-12 place-items-center rounded-full border border-cream/60 bg-cream/90 text-3xl shadow-lg transition hover:translate-x-1 hover:bg-white focus:outline-none focus:ring-4 focus:ring-sage/35">
                  ›
                </button>
                <button type="button" onClick={() => setMobileShelvesOpen(true)} className="absolute bottom-2 left-1/2 z-20 min-h-11 -translate-x-1/2 rounded-full border border-cream/70 bg-cream/95 px-4 py-2 text-xs font-black text-deep-brown shadow-lg transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-sage/30 lg:hidden">
                  Choose another bookcase
                </button>
                {!onboardingDismissed ? <span className="absolute bottom-16 left-1/2 z-20 -translate-x-1/2 rounded-full bg-deep-brown/70 px-3 py-1 text-[11px] font-black text-cream shadow-lg motion-safe:animate-[shelf_slide_hint_1.4s_ease-in-out_2] lg:hidden">Swipe the shelf wall</span> : null}
              </>
            )}
          </div>

          {arrangeMode ? <UnplacedQueue copies={unshelvedCopies} selectedCopyId={selectedCopyId} pending={isPending} onChooseBook={chooseBook} onMoveCopy={moveCopy} /> : null}
        </div>

        <aside className={`${mobileShelvesOpen ? "fixed inset-x-3 bottom-3 max-h-[78vh] overflow-y-auto" : "hidden"} z-50 rounded-[2rem] border border-cream/70 bg-cream/95 p-4 shadow-2xl shadow-amber-shadow/25 backdrop-blur lg:relative lg:inset-auto lg:block lg:max-h-none lg:overflow-visible lg:bg-cream/90 lg:shadow-xl lg:self-stretch`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-muted-text">Bookcase picker</p>
              <h2 className="mt-1 font-heading text-2xl">Your bookcases</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-sage/20 px-3 py-1 text-xs font-bold text-deep-brown">← →</div>
              <button type="button" onClick={() => setMobileShelvesOpen(false)} className="grid min-h-11 min-w-11 place-items-center rounded-full bg-soft-red text-lg font-black text-white shadow-sm lg:hidden" aria-label="Close bookcase picker">×</button>
            </div>
          </div>
          <div className="mt-4 grid max-h-[24rem] gap-2 overflow-y-auto pr-1">
            {shelfOptions.map((option, index) => (
              <ShelfSwitcherButton key={option.shelf.id} option={option} index={index} selected={index === boundedActiveIndex} onSelect={() => selectShelf(index)} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl border border-warm-border bg-white/70 p-3">
              <span className="block font-black uppercase tracking-wide text-muted-text">Copies</span>
              <span className="mt-1 block font-heading text-2xl text-deep-brown">{copyCount}</span>
            </div>
            <div className="rounded-2xl border border-warm-border bg-white/70 p-3">
              <span className="block font-black uppercase tracking-wide text-muted-text">How full</span>
              <span className="mt-1 block font-heading text-2xl text-deep-brown">{occupancyPercent}%</span>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-warm-border bg-white/70 p-3 text-xs leading-5 text-muted-text">
            Drag a book to a new spot, or tap it once and pick a shelf. If a spot is full, the older book waits below for a new home.
          </div>
        </aside>
      </div>

      {selectedCopy && !detailCopy ? <BookTooltip copy={selectedCopy} onOpen={() => setDetailCopyId(selectedCopy.id)} onDismiss={() => setSelectedCopyId(null)} /> : null}
      {detailCopy ? <BookDetailPanel copy={detailCopy} pending={isPending} onSaveColor={saveColor} onClose={() => { playCozySound("close"); setDetailCopyId(null); }} /> : null}
    </section>
  );
}

function FirstVisitNote({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mt-4 rounded-3xl border border-sage/25 bg-[#fff7df] p-4 shadow-inner">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-muted-text">Welcome to the reading nook</p>
          <p className="mt-2 text-sm font-bold leading-6 text-deep-brown">
            Switch bookcases with the arrows, tap a book once to peek, tap it again for details, or search to find exactly where a favorite is tucked away.
          </p>
        </div>
        <button type="button" onClick={onDismiss} className="min-h-11 rounded-full border border-warm-border bg-white px-4 py-2 text-xs font-black text-deep-brown shadow-sm transition hover:-translate-y-0.5 hover:bg-cream focus:outline-none focus:ring-4 focus:ring-sage/25">
          Got it
        </button>
      </div>
    </div>
  );
}

function ShelfHelpCard() {
  return (
    <div className="mt-4 grid gap-3 rounded-3xl border border-warm-border bg-white/75 p-4 text-sm text-deep-brown shadow-inner sm:grid-cols-2">
      <div>
        <p className="font-heading text-xl leading-none">Finding a book</p>
        <p className="mt-2 text-muted-text">Use the shelf search for title, author, room, or bookcase name. Results jump straight to the right shelf.</p>
      </div>
      <div>
        <p className="font-heading text-xl leading-none">Moving a book</p>
        <p className="mt-2 text-muted-text">Tap a spine once, then choose a “Settle here” spot. On desktop, dragging works too.</p>
      </div>
    </div>
  );
}

function ShelfSwitcherButton({ option, index, selected, onSelect }: { option: ShelfOption; index: number; selected: boolean; onSelect: () => void }) {
  const shelfCopyCount = countCopies(option.shelf);
  const shelfOccupancyPercent = getShelfOccupancyPercent(option.shelf);

  return (
    <button type="button" onClick={onSelect} className={`group rounded-2xl border p-3 text-left transition duration-200 focus:outline-none focus:ring-4 focus:ring-sage/30 ${selected ? "border-deep-brown bg-deep-brown text-cream shadow-lg" : "border-warm-border bg-white/72 text-deep-brown hover:-translate-y-0.5 hover:bg-white"}`}>
      <span className="flex items-start gap-3">
        <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage/20 text-sm font-black group-hover:bg-sage/30">{index + 1}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-lg leading-tight">{option.shelf.name}</span>
          <span className={`mt-1 block text-xs ${selected ? "text-cream/75" : "text-muted-text"}`}>({option.locationLabel})</span>
          <span className={`mt-2 block text-xs font-semibold ${selected ? "text-cream/85" : "text-muted-text"}`}>{option.shelf.rowCount} shelves · {shelfCopyCount} copies</span>
          <span className={`mt-2 block h-1.5 overflow-hidden rounded-full ${selected ? "bg-cream/20" : "bg-warm-border"}`} role="progressbar" aria-label={`${option.shelf.name} occupancy`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={shelfOccupancyPercent}>
            <span className={`block h-full rounded-full ${selected ? "bg-cream" : "bg-sage"}`} style={{ width: `${shelfOccupancyPercent}%` }} />
          </span>
        </span>
      </span>
    </button>
  );
}

function ActiveBookshelf({ option, direction, animate, selectedCopyId, detailCopyId, pending, arrangeMode, onChooseBook, onMoveCopy }: { option: ShelfOption; direction: "next" | "previous"; animate: boolean; selectedCopyId: string | null; detailCopyId: string | null; pending: boolean; arrangeMode: boolean; onChooseBook: (copy: HouseBrowserCopy) => void; onMoveCopy: (copyId: string, targetSlotId: string | null, targetPosition?: number | null) => void }) {
  const shelf = option.shelf;
  const rows = Array.from({ length: Math.max(1, shelf.rowCount) }, (_, index) => index + 1);
  const animationClass = animate ? (direction === "next" ? "animate-[shelf-slide-next_360ms_cubic-bezier(.22,1,.36,1)]" : "animate-[shelf-slide-previous_360ms_cubic-bezier(.22,1,.36,1)]") : "";
  const frameColor = shelf.frameColor ?? DEFAULT_FRAME;
  const shelfColor = shelf.shelfColor ?? DEFAULT_SHELF;
  const trimColor = shelf.trimColor ?? DEFAULT_TRIM;
  const width = Math.min(44, Math.max(30, 30 + (shelf.widthUnits - 1) * 5));

  return (
    <div className={`relative z-10 ${animationClass}`} style={{ width: `min(88vw, ${width}rem)` }}>
      <div className="absolute -inset-x-12 bottom-0 h-12 rounded-[50%] bg-deep-brown/25 blur-xl" />
      <div className="relative rounded-[1.8rem] border-[14px] p-3 shadow-[0_38px_80px_rgba(40,23,12,.42)]" style={{ borderColor: frameColor, backgroundColor: trimColor }}>
        <div className="absolute -top-8 left-1/2 h-7 w-32 -translate-x-1/2 rounded-t-3xl border bg-[#8a6548]" style={{ borderColor: trimColor, backgroundColor: shelfColor }} />
        <div className="grid gap-2 rounded-xl p-2" style={{ backgroundColor: shelfColor }}>
          {rows.map((rowIndex) => (
            <ShelfRow key={rowIndex} shelf={shelf} rowIndex={rowIndex} selectedCopyId={selectedCopyId} detailCopyId={detailCopyId} pending={pending} arrangeMode={arrangeMode} onChooseBook={onChooseBook} onMoveCopy={onMoveCopy} />
          ))}
        </div>
      </div>
      <div className="mx-auto mt-3 w-[82%] rounded-b-[2rem] px-5 py-2 text-center text-xs font-bold uppercase tracking-[0.22em] text-cream/85 shadow-lg" style={{ backgroundColor: trimColor }}>
        {option.levelName} · {option.roomName}
      </div>
    </div>
  );
}

function ShelfRow({ shelf, rowIndex, selectedCopyId, detailCopyId, pending, arrangeMode, onChooseBook, onMoveCopy }: { shelf: ShelfOption["shelf"]; rowIndex: number; selectedCopyId: string | null; detailCopyId: string | null; pending: boolean; arrangeMode: boolean; onChooseBook: (copy: HouseBrowserCopy) => void; onMoveCopy: (copyId: string, targetSlotId: string | null, targetPosition?: number | null) => void }) {
  const rowSlots = shelf.slots.filter((slot) => slot.rowIndex === rowIndex).sort((a, b) => a.depthIndex - b.depthIndex);
  const frontSlot = rowSlots[0];
  const allRowCopies = rowSlots
    .flatMap((slot) => slot.copies.map((copy, copyIndex) => ({ slot, copy, copyIndex })))
    .sort((left, right) => (left.copy.shelfPosition ?? 9999) - (right.copy.shelfPosition ?? 9999) || left.copy.title.localeCompare(right.copy.title));
  const { visible: rowCopies, hiddenCount } = getVisibleRowCopies(shelf, rowIndex, 28);
  const nextPosition = Math.max(0, ...allRowCopies.map(({ copy }) => copy.shelfPosition ?? 0)) + 1;

  return (
    <div className="relative min-h-32 rounded-lg border-b-[12px] border-[#5c3b28] bg-[repeating-linear-gradient(92deg,rgba(255,255,255,.08)_0_2px,transparent_2px_10px),linear-gradient(180deg,#b99068,#8a6548)] px-3 pb-2 pt-5 shadow-inner">
      <div
        className="flex min-h-[6.5rem] items-end gap-1.5 overflow-x-auto overflow-y-hidden pb-1"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const copyId = event.dataTransfer.getData("text/plain");
          if (copyId && frontSlot) onMoveCopy(copyId, frontSlot.id, nextPosition);
        }}
      >
        {rowCopies.map(({ slot, copy, copyIndex }) => (
          <BookSpine key={copy.id} copy={copy} slot={slot} index={copyIndex} selected={selectedCopyId === copy.id} detailed={detailCopyId === copy.id} arrangeMode={arrangeMode} onChooseBook={onChooseBook} onMoveCopy={onMoveCopy} />
        ))}
        {hiddenCount ? (
          <span className="mb-1 grid h-14 min-w-14 place-items-center rounded-xl border border-cream/30 bg-deep-brown/35 px-2 text-[10px] font-black text-cream/85" title={`${hiddenCount} more books continue along this shelf`} aria-label={`${hiddenCount} more books continue along this shelf`}>
            +{hiddenCount}
          </span>
        ) : null}
        {arrangeMode && frontSlot ? (
          <button type="button" disabled={!selectedCopyId || pending} onClick={() => selectedCopyId && onMoveCopy(selectedCopyId, frontSlot.id, nextPosition)} className="mb-1 grid min-h-12 min-w-14 touch-manipulation place-items-center rounded-xl border border-dashed border-cream/55 bg-cream/15 px-2 text-[10px] font-black uppercase tracking-wide text-cream/80 transition enabled:hover:-translate-y-1 enabled:hover:bg-cream/25 disabled:cursor-default disabled:opacity-70">
            {selectedCopyId ? "Settle here" : allRowCopies.length ? "+" : "Open spot"}
          </button>
        ) : null}
      </div>
      <span className="absolute right-2 top-2 rounded-full bg-deep-brown/55 px-2 py-0.5 text-[10px] font-bold text-cream/80">{rowIndex}</span>
    </div>
  );
}

function getSpineTextColor(bgColor: string | undefined): string {
  if (!bgColor) return "text-cream";
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "text-deep-brown" : "text-cream";
}

function BookSpine({ copy, slot, index, selected, detailed, arrangeMode, onChooseBook, onMoveCopy }: { copy: HouseBrowserCopy; slot: HouseBrowserSlot; index: number; selected: boolean; detailed: boolean; arrangeMode: boolean; onChooseBook: (copy: HouseBrowserCopy) => void; onMoveCopy?: (copyId: string, targetSlotId: string | null, targetPosition?: number | null) => void }) {
  const height = 56 + (stableHash(copy.id) % 32);
  const width = Math.max(44, 34 + (stableHash(copy.title) % 14));
  const color = getCopySpineColor(copy);
  const depthOffset = slot.depthIndex > 1 ? "opacity-75 -ml-1" : "";
  const pullClass = detailed ? "-translate-y-10 scale-105 shadow-2xl" : selected ? "translate-y-4 scale-110 shadow-xl ring-4 ring-cream/45" : "hover:-translate-y-2 hover:shadow-lg";
  const tilt = ((stableHash(copy.id) % 7) - 3) * 0.35;
  const textColor = getSpineTextColor(color);
  const isNarrow = width < 50;
  const isWide = width > 40;

  return (
    <button
      type="button"
      draggable={arrangeMode}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", copy.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        if (!onMoveCopy) return;
        event.preventDefault();
        const sourceCopyId = event.dataTransfer.getData("text/plain");
        if (sourceCopyId && sourceCopyId !== copy.id) onMoveCopy(sourceCopyId, slot.id, copy.shelfPosition ?? index + 1);
      }}
      onClick={() => onChooseBook(copy)}
      title={`${copy.title} · ${copy.displayAuthor}`}
      className={`group relative shrink-0 touch-manipulation overflow-hidden rounded-t-[4px] border border-black/15 shadow-[inset_2px_0_0_rgba(255,255,255,.18),inset_-3px_0_0_rgba(0,0,0,.12),0_4px_8px_rgba(40,23,12,.22)] transition duration-300 rotate-[var(--book-tilt)] focus:outline-none focus:ring-4 focus:ring-cream/50 ${depthOffset} ${pullClass} ${arrangeMode ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{ height, width, backgroundColor: color, zIndex: slot.depthIndex === 1 ? 10 + index : index, "--book-tilt": `${tilt}deg` } as CSSProperties}
    >
      {arrangeMode ? <span className="absolute -right-1 -top-1 z-20 grid h-4 w-4 place-items-center rounded-full bg-amber-500 text-[8px] font-black text-white shadow-sm" title="Draggable in arrange mode">⠿</span> : null}
      <span className="absolute inset-x-0 top-1 h-px bg-white/35" />
      <span className="absolute inset-x-0 bottom-1 h-px bg-black/20" />
      <span className="absolute inset-y-1 left-1 w-px bg-white/35" />
      <span className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-[#fff7df]/70 via-[#ead8bd]/70 to-[#fff7df]/60" />
      <span className={`absolute inset-x-1 bottom-2 top-3 flex items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap [writing-mode:vertical-rl] rotate-180 ${isNarrow ? "text-[9px]" : "text-[10px]"} font-black leading-none ${textColor} drop-shadow-[0_1px_0_rgba(255,235,172,.35)] [text-shadow:0_1px_1px_rgba(0,0,0,.5)]`} title={copy.title}>
        {truncate(copy.title, 28)}
      </span>
      {isWide ? <span className={`absolute bottom-2 right-2 max-h-12 overflow-hidden text-ellipsis whitespace-nowrap [writing-mode:vertical-rl] rotate-180 text-[8px] font-bold ${textColor}/70 sm:text-[9px]`} title={copy.displayAuthor}>{truncate(copy.displayAuthor, 18)}</span> : null}
      <span className="sr-only">Select {copy.title} by {copy.displayAuthor}</span>
    </button>
  );
}

function UnplacedQueue({ copies, selectedCopyId, pending, onChooseBook, onMoveCopy }: { copies: HouseBrowserUnshelvedCopy[]; selectedCopyId: string | null; pending: boolean; onChooseBook: (copy: HouseBrowserCopy) => void; onMoveCopy: (copyId: string, targetSlotId: string | null) => void }) {
  return (
    <div
      className="relative z-20 rounded-[1.5rem] border border-cream/60 bg-cream/85 p-3 shadow-lg backdrop-blur"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const copyId = event.dataTransfer.getData("text/plain");
        if (copyId) onMoveCopy(copyId, null);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-muted-text">Books waiting for a home</p>
          <p className="text-xs text-muted-text">Books moved off a full spot rest here until you settle them onto a shelf.</p>
        </div>
        {selectedCopyId ? <button type="button" disabled={pending} onClick={() => onMoveCopy(selectedCopyId, null)} className="min-h-11 rounded-full border border-warm-border bg-white px-3 py-2 text-xs font-bold text-deep-brown shadow-sm">Rest selected here</button> : null}
      </div>
      <div className="mt-3 flex min-h-16 gap-2 overflow-x-auto pb-1">
        {copies.length ? copies.map((copy) => (
          <button key={copy.id} type="button" draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", copy.id)} onClick={() => onChooseBook(copy)} className={`min-w-36 rounded-2xl border p-2 text-left text-xs shadow-sm transition hover:-translate-y-0.5 ${selectedCopyId === copy.id ? "border-deep-brown bg-deep-brown text-cream" : "border-warm-border bg-white/85 text-deep-brown"}`}>
            <span className="block font-heading text-base leading-tight">{truncate(copy.title, 34)}</span>
            <span className="mt-1 block text-[11px] opacity-75">{truncate(copy.displayAuthor, 28)}</span>
          </button>
        )) : <div className="grid min-h-12 flex-1 place-items-center rounded-2xl border border-dashed border-warm-border bg-white/50 text-xs font-semibold text-muted-text">Every book has a shelf spot</div>}
      </div>
    </div>
  );
}

function ViewerSearch({ query, matches, onQueryChange, onSelect }: { query: string; matches: SearchMatch[]; onQueryChange: (query: string) => void; onSelect: (match: SearchMatch) => void }) {
  const trimmedQuery = query.trim();
  return (
    <div className="mt-4 rounded-3xl border border-warm-border bg-white/70 p-3 shadow-inner">
      <label className="grid gap-1 text-sm font-black text-deep-brown">
        Find a book and its shelf
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search title, author, shelf, room…"
          className="min-h-11 rounded-2xl border border-warm-border bg-cream px-4 py-2 text-sm font-semibold text-deep-brown outline-none transition placeholder:text-muted-text/70 focus:border-sage focus:ring-4 focus:ring-sage/20"
        />
      </label>
      {trimmedQuery.length >= 2 ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {matches.length ? matches.map((match) => (
            <button key={`${match.copy.id}-${match.shelfName}`} type="button" onClick={() => onSelect(match)} className="rounded-2xl border border-warm-border bg-cream/85 p-3 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-sage/25">
              <span className="flex gap-3">
                <span className="mt-1 h-12 w-4 shrink-0 rounded-sm border border-black/10 shadow-sm" style={{ backgroundColor: getCopySpineColor(match.copy) }} />
                <span>
                  <span className="block font-heading text-lg leading-tight text-deep-brown">{truncate(match.copy.title, 42)}</span>
                  <span className="mt-1 block font-bold text-muted-text">{truncate(match.copy.displayAuthor, 34)}</span>
                </span>
              </span>
              <span className="mt-2 block rounded-full bg-sage/15 px-2 py-1 font-black text-deep-brown">{match.shelfName} ({match.locationLabel}){match.rowLabel ? ` · ${match.rowLabel}` : ""}</span>
            </button>
          )) : <div className="rounded-2xl border border-dashed border-warm-border bg-cream/70 p-3 text-xs font-semibold text-muted-text sm:col-span-2">No shelf matches yet. Try title, author, room, or shelf name.</div>}
        </div>
      ) : <p className="mt-2 text-xs font-semibold text-muted-text">Type at least two characters to jump to the shelf and spot.</p>}
    </div>
  );
}

function ShelfEditForm({ option, pending, onSave }: { option: ShelfOption; pending: boolean; onSave: (formData: FormData) => void }) {
  const shelf = option.shelf;
  return (
    <form action={onSave} className="mt-4 grid gap-3 rounded-3xl border border-warm-border bg-white/75 p-4 text-sm shadow-inner sm:grid-cols-2">
      <input type="hidden" name="id" value={shelf.id} />
      <input type="hidden" name="roomId" value={shelf.roomId} />
      <input type="hidden" name="sceneKey" value={shelf.sceneKey} />
      <input type="hidden" name="sortOrder" value={shelf.sortOrder} />
      <input type="hidden" name="depthCount" value={shelf.depthCount} />

      <h4 className="text-sm font-semibold text-deep-brown mt-4 mb-2 sm:col-span-2">Identity</h4>
      <label className="grid gap-1 font-bold text-deep-brown sm:col-span-2">Shelf name<input name="name" defaultValue={shelf.name} className="min-h-11 rounded-xl border border-warm-border bg-cream px-3 py-2 font-normal" /></label>

      <h4 className="text-sm font-semibold text-deep-brown mt-4 mb-2 sm:col-span-2">Size</h4>
      <p className="text-xs text-muted-text sm:col-span-2 -mt-1 mb-1">Shelf count changes the number of rows. Width and height affect the visual proportions.</p>
      <label className="grid gap-1 font-bold text-deep-brown">Shelf count<input name="rowCount" type="number" min={1} max={12} defaultValue={shelf.rowCount} className="min-h-11 rounded-xl border border-warm-border bg-cream px-3 py-2 font-normal" /></label>
      <label className="grid gap-1 font-bold text-deep-brown">Width units<input name="widthUnits" type="number" min={1} max={4} defaultValue={shelf.widthUnits} className="min-h-11 rounded-xl border border-warm-border bg-cream px-3 py-2 font-normal" /></label>
      <label className="grid gap-1 font-bold text-deep-brown">Width meters<input name="widthMeters" type="number" step="0.1" min="0.1" defaultValue={shelf.widthMeters ?? ""} placeholder="optional" className="min-h-11 rounded-xl border border-warm-border bg-cream px-3 py-2 font-normal" /></label>
      <label className="grid gap-1 font-bold text-deep-brown">Height meters<input name="heightMeters" type="number" step="0.1" min="0.1" defaultValue={shelf.heightMeters ?? ""} placeholder="optional" className="min-h-11 rounded-xl border border-warm-border bg-cream px-3 py-2 font-normal" /></label>

      <h4 className="text-sm font-semibold text-deep-brown mt-4 mb-2 sm:col-span-2">Appearance</h4>
      <label className="grid gap-1 font-bold text-deep-brown">Frame color<input name="frameColor" type="color" defaultValue={shelf.frameColor ?? DEFAULT_FRAME} className="h-11 rounded-xl border border-warm-border bg-cream p-1" /></label>
      <label className="grid gap-1 font-bold text-deep-brown">Shelf color<input name="shelfColor" type="color" defaultValue={shelf.shelfColor ?? DEFAULT_SHELF} className="h-11 rounded-xl border border-warm-border bg-cream p-1" /></label>
      <label className="grid gap-1 font-bold text-deep-brown">Trim color<input name="trimColor" type="color" defaultValue={shelf.trimColor ?? DEFAULT_TRIM} className="h-11 rounded-xl border border-warm-border bg-cream p-1" /></label>

      <h4 className="text-sm font-semibold text-deep-brown mt-4 mb-2 sm:col-span-2">Notes</h4>
      <label className="grid gap-1 font-bold text-deep-brown sm:col-span-2">Notes<textarea name="notes" defaultValue={shelf.notes ?? ""} rows={3} className="min-h-11 rounded-xl border border-warm-border bg-cream px-3 py-2 font-normal resize-y" /></label>

      <button type="submit" disabled={pending} className="rounded-full bg-deep-brown px-4 py-2 font-black text-cream shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60 sm:col-span-2 mt-2">{pending ? "Saving…" : "Save shelf changes"}</button>
    </form>
  );
}

function BookTooltip({ copy, onOpen, onDismiss }: { copy: HouseBrowserCopy; onOpen: () => void; onDismiss: () => void }) {
  return (
    <div className="absolute bottom-28 left-1/2 z-40 w-[min(92vw,24rem)] -translate-x-1/2 rounded-[1.75rem] border border-warm-border bg-cream p-4 text-deep-brown shadow-2xl shadow-amber-shadow/25">
      <button type="button" onClick={onDismiss} className="absolute right-3 top-3 grid min-h-11 min-w-11 place-items-center rounded-full bg-soft-red text-lg font-black text-white shadow-sm">×</button>
      <p className="text-xs font-black uppercase tracking-[0.26em] text-muted-text">Book selected</p>
      <h3 className="mt-2 pr-12 font-heading text-3xl leading-none">{copy.title}</h3>
      <p className="mt-2 text-sm font-bold text-muted-text">{copy.displayAuthor}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onOpen} className="min-h-11 rounded-full bg-deep-brown px-4 py-2 text-xs font-black text-cream shadow-sm">Take a closer look</button>
        <Link href={`/books/${copy.bookId}`} className="inline-flex min-h-11 items-center rounded-full border border-warm-border bg-white px-4 py-2 text-xs font-black text-deep-brown shadow-sm">Open book page</Link>
      </div>
    </div>
  );
}

function BookDetailPanel({ copy, pending, onSaveColor, onClose }: { copy: HouseBrowserCopy; pending: boolean; onSaveColor: (copyId: string, color: string) => void; onClose: () => void }) {
  const [color, setColor] = useState(getCopySpineColor(copy));
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-deep-brown/30 p-4 backdrop-blur-sm">
      <div className="relative w-[min(94vw,34rem)] animate-[book-draw_360ms_cubic-bezier(.22,1,.36,1)] rounded-[2rem] border border-warm-border bg-cream p-6 text-deep-brown shadow-2xl shadow-amber-shadow/30">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 grid min-h-11 min-w-11 place-items-center rounded-full bg-soft-red text-xl font-black text-white shadow-lg transition hover:rotate-6 hover:scale-105">×</button>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-muted-text">Book from the shelf</p>
        <div className="mt-4 flex gap-4">
          <div className="h-32 w-16 shrink-0 rounded-md border border-black/10 shadow-lg" style={{ backgroundColor: color }} />
          <div className="min-w-0 flex-1 pr-8">
            <h3 className="font-heading text-4xl leading-none">{copy.title}</h3>
            <p className="mt-2 text-base font-bold text-muted-text">{copy.displayAuthor}</p>
            <p className="mt-2 text-xs text-muted-text">Copy {copy.copyLabel} · {copy.status.toLowerCase()}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 rounded-2xl border border-warm-border bg-white/70 p-4 sm:grid-cols-[1fr_auto]">
          <label className="grid gap-1 text-sm font-bold text-deep-brown">Editable book/spine color<input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-11 rounded-xl border border-warm-border bg-cream p-1" /></label>
          <button type="button" disabled={pending} onClick={() => onSaveColor(copy.id, color)} className="self-end rounded-full bg-deep-brown px-4 py-2 text-sm font-black text-cream shadow-sm disabled:opacity-60">Save color</button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/books/${copy.bookId}`} className="inline-flex min-h-11 items-center rounded-full bg-deep-brown px-4 py-2 text-sm font-black text-cream shadow-sm">Open book page</Link>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-warm-border bg-white px-4 py-2 text-sm font-black text-deep-brown shadow-sm">Set it back</button>
        </div>
      </div>
    </div>
  );
}

function BookcasesOverview({ shelfOptions, onSelectBookcase }: { shelfOptions: ShelfOption[]; onSelectBookcase: (index: number) => void }) {
  return (
    <div className="relative z-10 w-full max-w-3xl">
      <div className="grid gap-4 sm:grid-cols-2">
        {shelfOptions.map((option, index) => {
          const shelfCopyCount = countCopies(option.shelf);
          const shelfSlotCount = countSlots(option.shelf);
          const shelfOccupiedCount = countOccupiedSlots(option.shelf);
          const shelfOpenSpots = shelfSlotCount - shelfOccupiedCount;
          const shelfOccupancyPercent = getShelfOccupancyPercent(option.shelf);

          return (
            <button
              key={option.shelf.id}
              type="button"
              onClick={() => onSelectBookcase(index)}
              className="group rounded-2xl border border-warm-border bg-cream/90 p-4 text-left shadow-lg transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sage/30"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage/20 text-sm font-black text-deep-brown group-hover:bg-sage/30">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block font-heading text-lg leading-tight text-deep-brown">{option.shelf.name}</span>
                  <span className="mt-1 block text-xs text-muted-text">
                    {option.levelName} · {option.roomName}
                  </span>
                  <span className="mt-2 block text-xs font-semibold text-muted-text">
                    {option.shelf.rowCount} shelves · {shelfCopyCount} copies
                  </span>
                  <div className="mt-2 overflow-hidden rounded-full border border-warm-border bg-white/65" role="progressbar" aria-label={`${option.shelf.name} occupancy`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={shelfOccupancyPercent}>
                    <div className="h-2 rounded-full bg-sage transition-[width] duration-300" style={{ width: `${shelfOccupancyPercent}%` }} />
                  </div>
                  <div className="mt-2 flex gap-3 text-[11px] font-semibold text-muted-text">
                    <span>{shelfOccupiedCount} filled</span>
                    <span>{shelfOpenSpots} open</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function findCopy(slots: HouseBrowserSlot[], copyId: string | null) {
  if (!copyId) return null;
  for (const slot of slots) {
    const copy = slot.copies.find((item) => item.id === copyId);
    if (copy) return copy;
  }
  return null;
}

function findSearchMatches(shelfOptions: ShelfOption[], unshelvedCopies: HouseBrowserUnshelvedCopy[], query: string): SearchMatch[] {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length < 2) return [];

  const matches: SearchMatch[] = [];
  for (const [shelfIndex, option] of shelfOptions.entries()) {
    for (const slot of option.shelf.slots) {
      for (const copy of slot.copies) {
        const haystack = normalizeSearchText([copy.title, copy.displayAuthor, option.shelf.name, option.locationLabel, option.roomName, option.levelName, slot.label].join(" "));
        if (!haystack.includes(normalizedQuery)) continue;
        matches.push({
          copy,
          shelfIndex,
          shelfName: option.shelf.name,
          locationLabel: option.locationLabel,
          rowLabel: `Shelf ${slot.rowIndex}${copy.shelfPosition ? ` · position ${copy.shelfPosition}` : ""}`,
        });
      }
    }
  }

  for (const copy of unshelvedCopies) {
    const haystack = normalizeSearchText([copy.title, copy.displayAuthor, "waiting for a home unshelved"].join(" "));
    if (!haystack.includes(normalizedQuery)) continue;
    matches.push({ copy, shelfIndex: null, shelfName: "Books waiting for a home", locationLabel: "Not on a shelf", rowLabel: "" });
  }

  return matches.slice(0, 8);
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, Math.max(0, length - 1))}…` : value;
}

function getCopySpineColor(copy: HouseBrowserCopy | HouseBrowserUnshelvedCopy) {
  return copy.copySpineColor ?? copy.spineColor ?? SPINE_PALETTE[stableHash(`${copy.title}-${copy.id}`) % SPINE_PALETTE.length]!;
}

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
