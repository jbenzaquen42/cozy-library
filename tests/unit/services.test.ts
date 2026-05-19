import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../lib/db/prisma";
import {
  createBookshelf,
  createLevel,
  createRoom,
  deleteBookshelf,
  getLocationSummary,
  listLocations,
  updateBookshelf,
} from "../../lib/db/locations";
import { getSettingsStatus } from "../../lib/db/settings";
import { AppError, toAppErrorShape } from "../../lib/errors";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("service layer", () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.copy.deleteMany({ where: { book: { title: { startsWith: "Occupied Test" } } } });
    await prisma.book.deleteMany({ where: { title: { startsWith: "Occupied Test" } } });
    await prisma.houseLevel.deleteMany({ where: { sceneKey: { startsWith: "level.test-" } } });
    await prisma.houseLevel.deleteMany({ where: { sceneKey: { startsWith: "level.occupied-" } } });
  });

  it("returns the seeded location hierarchy", async () => {
    const locations = await listLocations({ includeSlots: true });

    expect(locations.map((level) => level.sceneKey)).toEqual(expect.arrayContaining(["level.downstairs", "level.upstairs"]));
    expect(locations.flatMap((level) => level.rooms).map((room) => room.sceneKey)).toEqual(
      expect.arrayContaining(["room.downstairs.entry", "room.upstairs.hallway", "room.upstairs.study"]),
    );
    expect(locations.flatMap((level) => level.rooms.flatMap((room) => room.bookshelves)).map((shelf) => shelf.sceneKey)).toEqual(
      expect.arrayContaining([
        "shelf.downstairs.entry.entry-shelf",
        "shelf.upstairs.hallway.bookcase-1",
        "shelf.upstairs.hallway.bookcase-2",
        "shelf.upstairs.hallway.bookcase-3",
        "shelf.upstairs.study.study-shelf",
      ]),
    );
  });

  it("summarizes seeded location counts", async () => {
    const summary = await getLocationSummary();
    expect(summary.levelCount).toBeGreaterThanOrEqual(2);
    expect(summary.roomCount).toBeGreaterThanOrEqual(3);
    expect(summary.bookshelfCount).toBeGreaterThanOrEqual(5);
    expect(summary.slotCount).toBeGreaterThanOrEqual(44);
  });

  it("reports database settings status", async () => {
    const status = await getSettingsStatus();

    expect(status.database.connected).toBe(true);
    expect(status.paths.dataDir).toBeTruthy();
  });

  it("creates shelf slots when adding and expanding a bookshelf", async () => {
    const suffix = crypto.randomUUID();
    const level = await createLevel({ name: "Test Level", sceneKey: `level.test-${suffix}`, sortOrder: 100 });
    const room = await createRoom({ levelId: level.id, name: "Test Room", sceneKey: `room.test-${suffix}`, sortOrder: 100 });
    const shelf = await createBookshelf({
      roomId: room.id,
      name: "Test Shelf",
      sceneKey: `shelf.test-${suffix}`,
      rowCount: 2,
      depthCount: 2,
      sortOrder: 100,
      widthUnits: 1,
    });

    await expect(prisma.shelfSlot.count({ where: { bookshelfId: shelf.id } })).resolves.toBe(4);

    await updateBookshelf({
      id: shelf.id,
      roomId: room.id,
      name: "Test Shelf",
      sceneKey: `shelf.test-${suffix}`,
      rowCount: 3,
      depthCount: 2,
      sortOrder: 100,
      widthUnits: 1,
    });

    await expect(prisma.shelfSlot.count({ where: { bookshelfId: shelf.id } })).resolves.toBe(6);
    await prisma.houseLevel.delete({ where: { id: level.id } });
  });

  it("blocks shrinking or deleting shelf slots that contain copies", async () => {
    const suffix = crypto.randomUUID();
    const level = await createLevel({ name: "Occupied Level", sceneKey: `level.occupied-${suffix}`, sortOrder: 100 });
    const room = await createRoom({ levelId: level.id, name: "Occupied Room", sceneKey: `room.occupied-${suffix}`, sortOrder: 100 });
    const shelf = await createBookshelf({
      roomId: room.id,
      name: "Occupied Shelf",
      sceneKey: `shelf.occupied-${suffix}`,
      rowCount: 2,
      depthCount: 2,
      sortOrder: 100,
      widthUnits: 1,
    });
    const occupiedSlot = await prisma.shelfSlot.findFirstOrThrow({
      where: { bookshelfId: shelf.id, rowIndex: 2, depthIndex: 2 },
    });
    const book = await prisma.book.create({ data: { title: "Occupied Test Book", displayAuthor: "Test Author" } });
    const copy = await prisma.copy.create({
      data: { bookId: book.id, copyLabel: "1", locationSlotId: occupiedSlot.id },
    });

    await expect(
      updateBookshelf({
        id: shelf.id,
        roomId: room.id,
        name: "Occupied Shelf",
        sceneKey: `shelf.occupied-${suffix}`,
        rowCount: 1,
        depthCount: 2,
        sortOrder: 100,
        widthUnits: 1,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await expect(deleteBookshelf(shelf.id)).rejects.toMatchObject({ code: "CONFLICT" });

    await prisma.copy.delete({ where: { id: copy.id } });
    await prisma.book.delete({ where: { id: book.id } });
    await prisma.houseLevel.delete({ where: { id: level.id } });
  });
});

describe("AppError handling", () => {
  it("serializes application errors consistently", () => {
    expect(toAppErrorShape(new AppError("BAD_REQUEST", "Invalid value", "title"))).toEqual({
      code: "BAD_REQUEST",
      message: "Invalid value",
      field: "title",
    });
  });
});
