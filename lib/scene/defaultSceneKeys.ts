export const DEFAULT_SCENE_KEYS = {
  levels: {
    downstairs: "level.downstairs",
    upstairs: "level.upstairs",
  },
  rooms: {
    downstairsEntry: "room.downstairs.entry",
    upstairsHallway: "room.upstairs.hallway",
    upstairsStudy: "room.upstairs.study",
  },
  shelves: {
    downstairsEntryShelf: "shelf.downstairs.entry.entry-shelf",
    upstairsHallwayBookcase1: "shelf.upstairs.hallway.bookcase-1",
    upstairsHallwayBookcase2: "shelf.upstairs.hallway.bookcase-2",
    upstairsHallwayBookcase3: "shelf.upstairs.hallway.bookcase-3",
    upstairsStudyShelf: "shelf.upstairs.study.study-shelf",
  },
} as const;

export type ShelfSeed = {
  name: string;
  sceneKey: string;
  rowCount: number;
  depthCount: number;
  sortOrder: number;
};

export type RoomSeed = {
  name: string;
  sceneKey: string;
  sortOrder: number;
  shelves: ShelfSeed[];
};

export type LevelSeed = {
  name: string;
  sceneKey: string;
  sortOrder: number;
  rooms: RoomSeed[];
};

export const DEFAULT_HOUSE_LAYOUT: LevelSeed[] = [
  {
    name: "Downstairs",
    sceneKey: DEFAULT_SCENE_KEYS.levels.downstairs,
    sortOrder: 1,
    rooms: [
      {
        name: "Entry / Front Door",
        sceneKey: DEFAULT_SCENE_KEYS.rooms.downstairsEntry,
        sortOrder: 1,
        shelves: [
          {
            name: "Hedgehog Shelf",
            sceneKey: DEFAULT_SCENE_KEYS.shelves.downstairsEntryShelf,
            rowCount: 5,
            depthCount: 2,
            sortOrder: 1,
          },
        ],
      },
    ],
  },
  {
    name: "Upstairs",
    sceneKey: DEFAULT_SCENE_KEYS.levels.upstairs,
    sortOrder: 2,
    rooms: [
      {
        name: "Hallway",
        sceneKey: DEFAULT_SCENE_KEYS.rooms.upstairsHallway,
        sortOrder: 1,
        shelves: [
          {
            name: "Rabbit Shelf",
            sceneKey: DEFAULT_SCENE_KEYS.shelves.upstairsHallwayBookcase1,
            rowCount: 3,
            depthCount: 2,
            sortOrder: 1,
          },
          {
            name: "Wren Shelf",
            sceneKey: DEFAULT_SCENE_KEYS.shelves.upstairsHallwayBookcase2,
            rowCount: 3,
            depthCount: 2,
            sortOrder: 2,
          },
          {
            name: "Fox Shelf",
            sceneKey: DEFAULT_SCENE_KEYS.shelves.upstairsHallwayBookcase3,
            rowCount: 3,
            depthCount: 2,
            sortOrder: 3,
          },
        ],
      },
      {
        name: "Reading Room",
        sceneKey: DEFAULT_SCENE_KEYS.rooms.upstairsStudy,
        sortOrder: 2,
        shelves: [
          {
            name: "Fawn Shelf",
            sceneKey: DEFAULT_SCENE_KEYS.shelves.upstairsStudyShelf,
            rowCount: 5,
            depthCount: 2,
            sortOrder: 1,
          },
        ],
      },
    ],
  },
];

export type GeneratedShelfSlot = {
  rowIndex: number;
  depthIndex: number;
  label: string;
};

export function generateShelfSlots(rowCount: number, depthCount: number): GeneratedShelfSlot[] {
  if (!Number.isInteger(rowCount) || rowCount < 1) {
    throw new Error("rowCount must be a positive integer");
  }

  if (!Number.isInteger(depthCount) || depthCount < 1) {
    throw new Error("depthCount must be a positive integer");
  }

  const slots: GeneratedShelfSlot[] = [];

  for (let rowIndex = 1; rowIndex <= rowCount; rowIndex += 1) {
    for (let depthIndex = 1; depthIndex <= depthCount; depthIndex += 1) {
      slots.push({
        rowIndex,
        depthIndex,
        label: `Row ${rowIndex} · ${depthIndex === 1 ? "Front" : `Depth ${depthIndex}`}`,
      });
    }
  }

  return slots;
}

export function getDefaultShelfSlotCount() {
  return DEFAULT_HOUSE_LAYOUT.reduce(
    (levelTotal, level) =>
      levelTotal +
      level.rooms.reduce(
        (roomTotal, room) =>
          roomTotal + room.shelves.reduce((shelfTotal, shelf) => shelfTotal + shelf.rowCount * shelf.depthCount, 0),
        0,
      ),
    0,
  );
}

export function getDefaultLivingRoomShelfSceneKeys() {
  return DEFAULT_HOUSE_LAYOUT.flatMap((level) => level.rooms.flatMap((room) => room.shelves.map((shelf) => shelf.sceneKey)));
}

export function getDefaultActiveLivingRoomShelfSceneKey() {
  return DEFAULT_SCENE_KEYS.shelves.downstairsEntryShelf;
}
