import type { HouseBrowserCopy, HouseBrowserLevel, HouseBrowserShelf, HouseBrowserSlot } from "@/lib/db/houseBrowser";

export const MAX_VISIBLE_BOOKS_PER_ROW = 20;

export function getTargetBooksPerRow(shelfName: string, sceneKey?: string): number {
  if (sceneKey) {
    if (sceneKey.includes("hallway.bookcase-1") || sceneKey.includes("hallway.bookcase-2") || sceneKey.includes("hallway.bookcase-3")) return 27;
    if (sceneKey.includes("entry.entry-shelf") || sceneKey.includes("study.study-shelf")) return 22;
  }
  const lower = shelfName.toLowerCase();
  if (lower.includes("rabbit") || lower.includes("wren") || lower.includes("fox")) return 27;
  if (lower.includes("hedgehog") || lower.includes("fawn")) return 22;
  return 20;
}

export function getShelfDisplayWidthRem(shelfName: string, sceneKey?: string): number {
  const target = getTargetBooksPerRow(shelfName, sceneKey);
  // Bookshelf structure padding/border budget (px):
  // outer border-[14px] = 28, outer p-3 = 24, inner grid p-2 = 16, shelf row px-3 = 24
  const totalPaddingPx = 92;
  const minSpineWidth = 22;
  const gapPx = 6;
  const widthPx = target * minSpineWidth + (target - 1) * gapPx + totalPaddingPx;
  return Math.min(56, Math.max(30, widthPx / 16));
}

export type ShelfOption = {
  shelf: HouseBrowserShelf;
  roomName: string;
  levelName: string;
  locationLabel: string;
};

export type VisibleRowCopy = {
  slot: HouseBrowserSlot;
  copy: HouseBrowserCopy;
  copyIndex: number;
};

export function flattenShelfOptions(levels: HouseBrowserLevel[]): ShelfOption[] {
  return levels.flatMap((level) =>
    level.rooms.flatMap((room) =>
      room.shelves.map((shelf) => ({
        shelf,
        roomName: friendlyRoomName(room.name),
        levelName: friendlyLevelName(level.name),
        locationLabel: `${friendlyLevelName(level.name)} · ${friendlyRoomName(room.name)}`,
      })),
    ),
  );
}

export function friendlyLevelName(name: string) {
  return name.toLowerCase() === "downstairs" ? "First Floor" : name;
}

export function friendlyRoomName(name: string) {
  return name === "Entry / Front Door" ? "Entry" : name.replace("Reading Room / ", "");
}

export function countCopies(shelf: HouseBrowserShelf) {
  return shelf.slots.reduce((total, slot) => total + slot.copies.length, 0);
}

export function countSlots(shelf: HouseBrowserShelf) {
  return shelf.rowCount * shelf.depthCount;
}

export function countOccupiedSlots(shelf: HouseBrowserShelf) {
  return shelf.slots.reduce((total, slot) => total + (slot.copies.length ? 1 : 0), 0);
}

export function getShelfOccupancyPercent(shelf: HouseBrowserShelf) {
  if (shelf.rowCount < 1 || shelf.depthCount < 1) return 0;
  return Math.round((countOccupiedSlots(shelf) / countSlots(shelf)) * 100);
}

export function getVisibleRowCopies(shelf: HouseBrowserShelf, rowIndex: number, limit = MAX_VISIBLE_BOOKS_PER_ROW) {
  const rowSlots = [...shelf.slots].filter((slot) => slot.rowIndex === rowIndex).sort((a, b) => a.depthIndex - b.depthIndex);
  const copies = rowSlots
    .flatMap((slot) => slot.copies.map((copy, copyIndex) => ({ copy, slot, copyIndex })))
    .sort((left, right) => {
      const leftPosition = left.copy.shelfPosition;
      const rightPosition = right.copy.shelfPosition;
      if (leftPosition !== null && rightPosition !== null && leftPosition !== rightPosition) return leftPosition - rightPosition;
      if (leftPosition !== null && rightPosition === null) return -1;
      if (leftPosition === null && rightPosition !== null) return 1;
      return left.slot.depthIndex - right.slot.depthIndex || left.copyIndex - right.copyIndex || left.copy.title.localeCompare(right.copy.title);
    });
  const visible = copies.slice(0, limit);

  return {
    visible,
    hiddenCount: Math.max(0, copies.length - visible.length),
  };
}

export function getBoundedShelfIndex(shelfCount: number, activeIndex: number) {
  if (shelfCount < 1) return 0;
  return Math.min(Math.max(0, activeIndex), shelfCount - 1);
}
