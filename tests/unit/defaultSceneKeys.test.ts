import { describe, expect, it } from "vitest";
import { DEFAULT_HOUSE_LAYOUT, generateShelfSlots, getDefaultActiveLivingRoomShelfSceneKey, getDefaultLivingRoomShelfSceneKeys, getDefaultShelfSlotCount } from "../../lib/scene/defaultSceneKeys";
import { getNextCopyLabel } from "../../lib/db/copies";

describe("default house scene keys", () => {
  it("defines the exact default house layout", () => {
    expect(DEFAULT_HOUSE_LAYOUT).toMatchObject([
      {
        name: "Downstairs",
        sceneKey: "level.downstairs",
        rooms: [
          {
            name: "Entry / Front Door",
            sceneKey: "room.downstairs.entry",
            shelves: [
              {
                name: "Hedgehog Shelf",
                sceneKey: "shelf.downstairs.entry.entry-shelf",
                rowCount: 5,
                depthCount: 2,
              },
            ],
          },
        ],
      },
      {
        name: "Upstairs",
        sceneKey: "level.upstairs",
        rooms: [
          {
            name: "Hallway",
            sceneKey: "room.upstairs.hallway",
            shelves: [
              { name: "Rabbit Shelf", sceneKey: "shelf.upstairs.hallway.bookcase-1", rowCount: 3, depthCount: 2 },
              { name: "Wren Shelf", sceneKey: "shelf.upstairs.hallway.bookcase-2", rowCount: 3, depthCount: 2 },
              { name: "Fox Shelf", sceneKey: "shelf.upstairs.hallway.bookcase-3", rowCount: 3, depthCount: 2 },
            ],
          },
          {
            name: "Reading Room",
            sceneKey: "room.upstairs.study",
            shelves: [{ name: "Fawn Shelf", sceneKey: "shelf.upstairs.study.study-shelf", rowCount: 5, depthCount: 2 }],
          },
        ],
      },
    ]);
  });

  it("generates row/depth slots in top-to-bottom and front-to-back order", () => {
    expect(generateShelfSlots(2, 2)).toEqual([
      { rowIndex: 1, depthIndex: 1, label: "Row 1 · Front" },
      { rowIndex: 1, depthIndex: 2, label: "Row 1 · Depth 2" },
      { rowIndex: 2, depthIndex: 1, label: "Row 2 · Front" },
      { rowIndex: 2, depthIndex: 2, label: "Row 2 · Depth 2" },
    ]);
  });

  it("counts all default shelf slots", () => {
    expect(getDefaultShelfSlotCount()).toBe(38);
  });

  it("defines the living-room browser shelf order and default active shelf", () => {
    expect(getDefaultActiveLivingRoomShelfSceneKey()).toBe("shelf.downstairs.entry.entry-shelf");
    expect(getDefaultLivingRoomShelfSceneKeys()).toEqual([
      "shelf.downstairs.entry.entry-shelf",
      "shelf.upstairs.hallway.bookcase-1",
      "shelf.upstairs.hallway.bookcase-2",
      "shelf.upstairs.hallway.bookcase-3",
      "shelf.upstairs.study.study-shelf",
    ]);
  });

  it("rejects invalid row and depth counts", () => {
    expect(() => generateShelfSlots(0, 2)).toThrow("rowCount must be a positive integer");
    expect(() => generateShelfSlots(2, 0)).toThrow("depthCount must be a positive integer");
  });
});

describe("copy label assignment", () => {
  it("assigns the first copy label as 1", () => {
    expect(getNextCopyLabel([])).toBe("1");
  });

  it("assigns the next available numeric label", () => {
    expect(getNextCopyLabel(["1", "2", "3"])).toBe("4");
    expect(getNextCopyLabel(["1", "3", "signed"])).toBe("2");
  });
});
