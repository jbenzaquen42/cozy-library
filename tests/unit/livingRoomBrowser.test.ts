import { describe, expect, it } from "vitest";
import type { HouseBrowserLevel, HouseBrowserShelf, HouseBrowserSlot } from "@/lib/db/houseBrowser";
import {
  countCopies,
  countSlots,
  countOccupiedSlots,
  getShelfOccupancyPercent,
  flattenShelfOptions,
  friendlyLevelName,
  friendlyRoomName,
  getVisibleRowCopies,
  getBoundedShelfIndex,
  getTargetBooksPerRow,
  getShelfDisplayWidthRem,
} from "../../lib/scene/livingRoomBrowser";

// --- Minimal fixture helpers ---

function makeSlot(id: string, rowIndex: number, depthIndex: number, copies: { id: string; title: string; displayAuthor: string }[] = []): HouseBrowserSlot {
  return {
    id,
    rowIndex,
    depthIndex,
    label: `Row ${rowIndex} · ${depthIndex === 1 ? "Front" : `Depth ${depthIndex}`}`,
    copies: copies.map((c) => ({
      id: c.id,
      copyLabel: "1",
      status: "available",
      bookId: `book-${c.id}`,
      title: c.title,
      displayAuthor: c.displayAuthor,
      spineColor: null,
      copySpineColor: null,
      coverImagePath: null,
      shelfPosition: null,
    })),
  };
}

function makeShelf(overrides: Partial<HouseBrowserShelf> & { slots: HouseBrowserSlot[] }): HouseBrowserShelf {
  return {
    id: "shelf-1",
    name: "Test Shelf",
    sceneKey: "shelf.test.test-shelf",
    rowCount: 3,
    depthCount: 2,
    sortOrder: 1,
    widthUnits: 1,
    presetName: null,
    widthMeters: null,
    heightMeters: null,
    depthMeters: null,
    positionX: null,
    positionY: null,
    positionZ: null,
    rotationX: null,
    rotationY: null,
    rotationZ: null,
    frameColor: null,
    shelfColor: null,
    trimColor: null,
    notes: null,
    roomId: "room-1",
    roomName: "Test Room",
    levelName: "Test Level",
    ...overrides,
  };
}

function makeLevel(rooms: HouseBrowserLevel["rooms"], name = "Test Level"): HouseBrowserLevel {
  return { id: `level-${name}`, name, sceneKey: `level.${name.toLowerCase().replaceAll(" ", "-")}`, rooms };
}

function makeRoom(shelves: HouseBrowserLevel["rooms"][number]["shelves"], name = "Test Room"): HouseBrowserLevel["rooms"][number] {
  return { id: "room-1", name, sceneKey: "room.test", levelName: "Test Level", shelves };
}

// --- friendlyLevelName / friendlyRoomName ---

describe("friendlyLevelName", () => {
  it("maps 'Downstairs' to 'First Floor'", () => {
    expect(friendlyLevelName("Downstairs")).toBe("First Floor");
  });

  it("maps lowercase 'downstairs' to 'First Floor'", () => {
    expect(friendlyLevelName("downstairs")).toBe("First Floor");
  });

  it("passes through other names unchanged", () => {
    expect(friendlyLevelName("Upstairs")).toBe("Upstairs");
    expect(friendlyLevelName("Basement")).toBe("Basement");
  });
});

describe("friendlyRoomName", () => {
  it("maps 'Entry / Front Door' to 'Entry'", () => {
    expect(friendlyRoomName("Entry / Front Door")).toBe("Entry");
  });

  it("strips 'Reading Room / ' prefix", () => {
    expect(friendlyRoomName("Reading Room / Study")).toBe("Study");
  });

  it("passes through other names unchanged", () => {
    expect(friendlyRoomName("Hallway")).toBe("Hallway");
    expect(friendlyRoomName("Kitchen")).toBe("Kitchen");
  });
});

// --- countCopies / countSlots / countOccupiedSlots / getShelfOccupancyPercent ---

describe("countCopies", () => {
  it("returns 0 for a shelf with no copies", () => {
    const shelf = makeShelf({
      rowCount: 2,
      depthCount: 2,
      slots: [
        makeSlot("s1", 1, 1),
        makeSlot("s2", 1, 2),
        makeSlot("s3", 2, 1),
        makeSlot("s4", 2, 2),
      ],
    });
    expect(countCopies(shelf)).toBe(0);
  });

  it("counts copies across all slots", () => {
    const shelf = makeShelf({
      rowCount: 2,
      depthCount: 2,
      slots: [
        makeSlot("s1", 1, 1, [{ id: "c1", title: "A", displayAuthor: "X" }]),
        makeSlot("s2", 1, 2, [{ id: "c2", title: "B", displayAuthor: "Y" }, { id: "c3", title: "C", displayAuthor: "Z" }]),
        makeSlot("s3", 2, 1),
        makeSlot("s4", 2, 2, [{ id: "c4", title: "D", displayAuthor: "W" }]),
      ],
    });
    expect(countCopies(shelf)).toBe(4);
  });
});

describe("countSlots", () => {
  it("returns rowCount * depthCount", () => {
    expect(countSlots(makeShelf({ rowCount: 3, depthCount: 2, slots: [] }))).toBe(6);
    expect(countSlots(makeShelf({ rowCount: 5, depthCount: 1, slots: [] }))).toBe(5);
    expect(countSlots(makeShelf({ rowCount: 1, depthCount: 1, slots: [] }))).toBe(1);
  });

  it("returns 0 for zero dimensions", () => {
    expect(countSlots(makeShelf({ rowCount: 0, depthCount: 0, slots: [] }))).toBe(0);
  });
});

describe("countOccupiedSlots", () => {
  it("counts slots that have at least one copy", () => {
    const shelf = makeShelf({
      rowCount: 2,
      depthCount: 2,
      slots: [
        makeSlot("s1", 1, 1, [{ id: "c1", title: "A", displayAuthor: "X" }]),
        makeSlot("s2", 1, 2),
        makeSlot("s3", 2, 1, [{ id: "c2", title: "B", displayAuthor: "Y" }]),
        makeSlot("s4", 2, 2),
      ],
    });
    expect(countOccupiedSlots(shelf)).toBe(2);
  });

  it("returns 0 when no slots are occupied", () => {
    const shelf = makeShelf({
      rowCount: 2,
      depthCount: 2,
      slots: [makeSlot("s1", 1, 1), makeSlot("s2", 1, 2)],
    });
    expect(countOccupiedSlots(shelf)).toBe(0);
  });
});

describe("getShelfOccupancyPercent", () => {
  it("returns 0 when there are no slots", () => {
    const shelf = makeShelf({ rowCount: 0, depthCount: 0, slots: [] });
    expect(getShelfOccupancyPercent(shelf)).toBe(0);
  });

  it("returns 100 when all slots are occupied", () => {
    const shelf = makeShelf({
      rowCount: 2,
      depthCount: 2,
      slots: [
        makeSlot("s1", 1, 1, [{ id: "c1", title: "A", displayAuthor: "X" }]),
        makeSlot("s2", 1, 2, [{ id: "c2", title: "B", displayAuthor: "Y" }]),
        makeSlot("s3", 2, 1, [{ id: "c3", title: "C", displayAuthor: "Z" }]),
        makeSlot("s4", 2, 2, [{ id: "c4", title: "D", displayAuthor: "W" }]),
      ],
    });
    expect(getShelfOccupancyPercent(shelf)).toBe(100);
  });

  it("returns rounded percentage for partial occupancy", () => {
    const shelf = makeShelf({
      rowCount: 2,
      depthCount: 2,
      slots: [
        makeSlot("s1", 1, 1, [{ id: "c1", title: "A", displayAuthor: "X" }]),
        makeSlot("s2", 1, 2),
        makeSlot("s3", 2, 1),
        makeSlot("s4", 2, 2),
      ],
    });
    // 1 of 4 = 25%
    expect(getShelfOccupancyPercent(shelf)).toBe(25);
  });

  it("rounds to nearest integer", () => {
    const shelf = makeShelf({
      rowCount: 3,
      depthCount: 1,
      slots: [
        makeSlot("s1", 1, 1, [{ id: "c1", title: "A", displayAuthor: "X" }]),
        makeSlot("s2", 2, 1),
        makeSlot("s3", 3, 1),
      ],
    });
    // 1 of 3 = 33.33...% → 33
    expect(getShelfOccupancyPercent(shelf)).toBe(33);
  });
});

// --- flattenShelfOptions ---

describe("flattenShelfOptions", () => {
  it("produces one option per shelf with friendly names", () => {
    const levels: HouseBrowserLevel[] = [
      makeLevel([
        makeRoom([
          makeShelf({ id: "s1", name: "Entry Shelf", sceneKey: "shelf.downstairs.entry.entry-shelf", rowCount: 5, depthCount: 2, slots: [] }),
        ], "Entry / Front Door"),
      ], "Downstairs"),
      makeLevel([
        makeRoom([
          makeShelf({ id: "s2", name: "Bookcase 1", sceneKey: "shelf.upstairs.hallway.bookcase-1", rowCount: 3, depthCount: 2, slots: [] }),
          makeShelf({ id: "s3", name: "Bookcase 2", sceneKey: "shelf.upstairs.hallway.bookcase-2", rowCount: 3, depthCount: 2, slots: [] }),
        ], "Hallway"),
        makeRoom([
          makeShelf({ id: "s4", name: "Study Shelf", sceneKey: "shelf.upstairs.study.study-shelf", rowCount: 4, depthCount: 2, slots: [] }),
        ], "Reading Room / Study"),
      ], "Upstairs"),
    ];

    const options = flattenShelfOptions(levels);
    expect(options).toHaveLength(4);
    expect(options[0]).toMatchObject({
      shelf: expect.objectContaining({ sceneKey: "shelf.downstairs.entry.entry-shelf" }),
      levelName: "First Floor",
      roomName: "Entry",
      locationLabel: "First Floor · Entry",
    });
    expect(options[3]).toMatchObject({
      shelf: expect.objectContaining({ sceneKey: "shelf.upstairs.study.study-shelf" }),
      levelName: "Upstairs",
      roomName: "Study",
      locationLabel: "Upstairs · Study",
    });
  });

  it("returns empty array for empty levels", () => {
    expect(flattenShelfOptions([])).toEqual([]);
  });

  it("preserves shelf order across levels and rooms", () => {
    const levels: HouseBrowserLevel[] = [
      makeLevel([
        makeRoom([
          makeShelf({ id: "a", name: "A", sceneKey: "shelf.a", rowCount: 1, depthCount: 1, slots: [] }),
        ]),
        makeRoom([
          makeShelf({ id: "b", name: "B", sceneKey: "shelf.b", rowCount: 1, depthCount: 1, slots: [] }),
        ]),
      ]),
      makeLevel([
        makeRoom([
          makeShelf({ id: "c", name: "C", sceneKey: "shelf.c", rowCount: 1, depthCount: 1, slots: [] }),
        ]),
      ], "Level 2"),
    ];

    const options = flattenShelfOptions(levels);
    expect(options.map((o) => o.shelf.sceneKey)).toEqual(["shelf.a", "shelf.b", "shelf.c"]);
  });
});

// --- getVisibleRowCopies ---

describe("getVisibleRowCopies", () => {
  it("returns all copies when under the visible limit", () => {
    const shelf = makeShelf({
      rowCount: 1,
      depthCount: 1,
      slots: [
        makeSlot("s1", 1, 1, [
          { id: "c1", title: "A", displayAuthor: "X" },
          { id: "c2", title: "B", displayAuthor: "Y" },
        ]),
      ],
    });
    const result = getVisibleRowCopies(shelf, 1);
    expect(result.visible).toHaveLength(2);
    expect(result.hiddenCount).toBe(0);
  });

  it("clips to MAX_VISIBLE_BOOKS_PER_ROW and reports hidden count", () => {
    const copies = Array.from({ length: 25 }, (_, i) => ({
      id: `c${i}`,
      title: `Book ${i}`,
      displayAuthor: `Author ${i}`,
    }));
    const shelf = makeShelf({
      rowCount: 1,
      depthCount: 1,
      slots: [makeSlot("s1", 1, 1, copies)],
    });
    const result = getVisibleRowCopies(shelf, 1);
    expect(result.visible).toHaveLength(20);
    expect(result.hiddenCount).toBe(5);
  });

  it("aggregates copies across depth indices for a given row", () => {
    const shelf = makeShelf({
      rowCount: 1,
      depthCount: 2,
      slots: [
        makeSlot("s1", 1, 1, [{ id: "c1", title: "Front", displayAuthor: "A" }]),
        makeSlot("s2", 1, 2, [{ id: "c2", title: "Back", displayAuthor: "B" }]),
      ],
    });
    const result = getVisibleRowCopies(shelf, 1);
    expect(result.visible).toHaveLength(2);
    expect(result.visible[0].slot.depthIndex).toBe(1);
    expect(result.visible[1].slot.depthIndex).toBe(2);
  });

  it("returns empty visible array and 0 hidden for an empty row", () => {
    const shelf = makeShelf({
      rowCount: 1,
      depthCount: 1,
      slots: [makeSlot("s1", 1, 1)],
    });
    const result = getVisibleRowCopies(shelf, 1);
    expect(result.visible).toHaveLength(0);
    expect(result.hiddenCount).toBe(0);
  });

  it("sorts slots by depthIndex within the row", () => {
    const shelf = makeShelf({
      rowCount: 1,
      depthCount: 3,
      slots: [
        makeSlot("s3", 1, 3, [{ id: "c3", title: "Third", displayAuthor: "C" }]),
        makeSlot("s1", 1, 1, [{ id: "c1", title: "First", displayAuthor: "A" }]),
        makeSlot("s2", 1, 2, [{ id: "c2", title: "Second", displayAuthor: "B" }]),
      ],
    });
    const result = getVisibleRowCopies(shelf, 1);
    expect(result.visible.map((v) => v.slot.depthIndex)).toEqual([1, 2, 3]);
  });
});

// --- getTargetBooksPerRow ---

describe("getTargetBooksPerRow", () => {
  it("returns 27 for Rabbit, Wren, and Fox shelves by name", () => {
    expect(getTargetBooksPerRow("Rabbit Shelf")).toBe(27);
    expect(getTargetBooksPerRow("Wren Shelf")).toBe(27);
    expect(getTargetBooksPerRow("Fox Shelf")).toBe(27);
  });

  it("returns 27 for hallway bookcases by sceneKey", () => {
    expect(getTargetBooksPerRow("Any Name", "shelf.upstairs.hallway.bookcase-1")).toBe(27);
    expect(getTargetBooksPerRow("Any Name", "shelf.upstairs.hallway.bookcase-2")).toBe(27);
    expect(getTargetBooksPerRow("Any Name", "shelf.upstairs.hallway.bookcase-3")).toBe(27);
  });

  it("returns 22 for Hedgehog and Fawn shelves by name", () => {
    expect(getTargetBooksPerRow("Hedgehog Shelf")).toBe(22);
    expect(getTargetBooksPerRow("Fawn Shelf")).toBe(22);
  });

  it("returns 22 for entry and study shelves by sceneKey", () => {
    expect(getTargetBooksPerRow("Any Name", "shelf.downstairs.entry.entry-shelf")).toBe(22);
    expect(getTargetBooksPerRow("Any Name", "shelf.upstairs.study.study-shelf")).toBe(22);
  });

  it("returns 20 for unknown shelves", () => {
    expect(getTargetBooksPerRow("Mystery Shelf")).toBe(20);
    expect(getTargetBooksPerRow("Custom Bookcase", "shelf.custom.unknown")).toBe(20);
  });

  it("prefers sceneKey over name when provided", () => {
    expect(getTargetBooksPerRow("Hedgehog Shelf", "shelf.upstairs.hallway.bookcase-1")).toBe(27);
  });
});

// --- getShelfDisplayWidthRem ---

describe("getShelfDisplayWidthRem", () => {
  it("returns wider width for 27-book shelves", () => {
    const rabbitWidth = getShelfDisplayWidthRem("Rabbit Shelf");
    const hedgehogWidth = getShelfDisplayWidthRem("Hedgehog Shelf");
    expect(rabbitWidth).toBeGreaterThan(hedgehogWidth);
    expect(rabbitWidth).toBeGreaterThanOrEqual(48);
  });

  it("returns moderate width for 22-book shelves", () => {
    const width = getShelfDisplayWidthRem("Fawn Shelf");
    expect(width).toBeGreaterThanOrEqual(38);
    expect(width).toBeLessThanOrEqual(48);
  });

  it("caps at 54rem for very large targets", () => {
    expect(getShelfDisplayWidthRem("Huge Shelf")).toBeLessThanOrEqual(54);
  });

  it("has a minimum width of 34rem", () => {
    expect(getShelfDisplayWidthRem("Tiny Shelf")).toBeGreaterThanOrEqual(34);
  });
});

// --- getBoundedShelfIndex ---

describe("getBoundedShelfIndex", () => {
  it("returns 0 for empty shelf list", () => {
    expect(getBoundedShelfIndex(0, 5)).toBe(0);
  });

  it("bounds index to last element when too high", () => {
    expect(getBoundedShelfIndex(3, 10)).toBe(2);
  });

  it("returns the index when within bounds", () => {
    expect(getBoundedShelfIndex(5, 0)).toBe(0);
    expect(getBoundedShelfIndex(5, 2)).toBe(2);
    expect(getBoundedShelfIndex(5, 4)).toBe(4);
  });

  it("bounds negative indexes to zero", () => {
    expect(getBoundedShelfIndex(5, -2)).toBe(0);
  });

  it("handles single-element list", () => {
    expect(getBoundedShelfIndex(1, 0)).toBe(0);
    expect(getBoundedShelfIndex(1, 5)).toBe(0);
  });
});
