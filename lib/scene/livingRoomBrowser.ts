import type { HouseBrowserCopy, HouseBrowserLevel, HouseBrowserShelf, HouseBrowserSlot } from "@/lib/db/houseBrowser";

export const MAX_VISIBLE_BOOKS_PER_ROW = 20;

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
  const copies = rowSlots.flatMap((slot) => slot.copies.map((copy, copyIndex) => ({ copy, slot, copyIndex })));
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
