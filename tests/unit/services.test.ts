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
import { createCopy, listUnshelvedCopies, moveCopy } from "../../lib/db/copies";
import { deleteBookIfNoCopies } from "../../lib/db/books";
import { getSettingsStatus } from "../../lib/db/settings";
import { AppError, toAppErrorShape } from "../../lib/errors";
import { getDefaultShelfSlotCount } from "../../lib/scene/defaultSceneKeys";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("service layer", () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.copy.deleteMany({ where: { book: { title: { startsWith: "Occupied Test" } } } });
    await prisma.copy.deleteMany({ where: { book: { title: { startsWith: "Unshelved Test" } } } });
    await prisma.book.deleteMany({ where: { title: { startsWith: "Occupied Test" } } });
    await prisma.book.deleteMany({ where: { title: { startsWith: "Unshelved Test" } } });
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
    expect(summary.slotCount).toBeGreaterThanOrEqual(getDefaultShelfSlotCount());
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
      presetName: "Standard Bookcase",
      widthMeters: 0.9,
      heightMeters: 1.8,
      depthMeters: 0.32,
      positionX: 1.25,
      positionY: 0.9,
      positionZ: -1.5,
      rotationX: 0,
      rotationY: Math.PI / 2,
      rotationZ: 0,
      frameColor: "#b99068",
      shelfColor: "#8a6548",
    });

    await expect(prisma.shelfSlot.count({ where: { bookshelfId: shelf.id } })).resolves.toBe(4);
    expect(shelf.positionX).toBe(1.25);
    expect(shelf.frameColor).toBe("#b99068");

    const updatedShelf = await updateBookshelf({
      id: shelf.id,
      roomId: room.id,
      name: "Test Shelf",
      sceneKey: `shelf.test-${suffix}`,
      rowCount: 3,
      depthCount: 2,
      sortOrder: 100,
      widthUnits: 1,
      presetName: "Tall Bookcase",
      widthMeters: 0.9,
      heightMeters: 2.2,
      depthMeters: 0.34,
      positionX: 1.5,
      positionY: 1.1,
      positionZ: -1.75,
      rotationX: 0,
      rotationY: Math.PI,
      rotationZ: 0,
      frameColor: "#123456",
      shelfColor: "#654321",
    });

    await expect(prisma.shelfSlot.count({ where: { bookshelfId: shelf.id } })).resolves.toBe(6);
    expect(updatedShelf.heightMeters).toBe(2.2);
    expect(updatedShelf.positionZ).toBe(-1.75);
    expect(updatedShelf.shelfColor).toBe("#654321");
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

  it("creates unshelved copies and moves them into shelf slots", async () => {
    const suffix = crypto.randomUUID();
    const level = await createLevel({ name: "Unshelved Test Level", sceneKey: `level.unshelved-${suffix}`, sortOrder: 100 });
    const room = await createRoom({ levelId: level.id, name: "Unshelved Test Room", sceneKey: `room.unshelved-${suffix}`, sortOrder: 100 });
    const shelf = await createBookshelf({ roomId: room.id, name: "Unshelved Test Shelf", sceneKey: `shelf.unshelved-${suffix}`, rowCount: 1, depthCount: 1, sortOrder: 100, widthUnits: 1 });
    const book = await prisma.book.create({ data: { title: "Unshelved Test Book", displayAuthor: "Test Author" } });
    const copy = await createCopy({ bookId: book.id, condition: undefined, notes: undefined });

    expect(copy.locationSlotId).toBeNull();
    await expect(listUnshelvedCopies()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: copy.id })]));

    const slot = await prisma.shelfSlot.findFirstOrThrow({ where: { bookshelfId: shelf.id } });
    const moved = await moveCopy({ id: copy.id, locationSlotId: slot.id });

    expect(moved.locationSlotId).toBe(slot.id);
    await expect(listUnshelvedCopies()).resolves.not.toEqual(expect.arrayContaining([expect.objectContaining({ id: copy.id })]));

    await prisma.houseLevel.delete({ where: { id: level.id } });
    await prisma.book.delete({ where: { id: book.id } });
  });

  it("cleans up orphan Author rows after book deletion", async () => {
    const book = await prisma.book.create({ data: { title: "Orphan Author Test Book", displayAuthor: "Unique Orphan Author" } });
    const authorCount = await prisma.author.count({ where: { name: "Unique Orphan Author" } });
    expect(authorCount).toBeGreaterThanOrEqual(1);

    await deleteBookIfNoCopies(book.id);

    const orphanCount = await prisma.author.count({ where: { name: "Unique Orphan Author" } });
    expect(orphanCount).toBe(0);
  });

  it("refuses to delete a book that has copies", async () => {
    const book = await prisma.book.create({ data: { title: "Book With Copies", displayAuthor: "Test Author" } });
    const copy = await prisma.copy.create({ data: { bookId: book.id, copyLabel: "1" } });

    await expect(deleteBookIfNoCopies(book.id)).rejects.toMatchObject({ code: "CONFLICT" });

    await prisma.copy.delete({ where: { id: copy.id } });
    await prisma.book.delete({ where: { id: book.id } });
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
