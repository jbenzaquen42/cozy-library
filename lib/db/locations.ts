import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "./prisma";
import { AppError } from "../errors";
import { generateShelfSlots } from "../scene/defaultSceneKeys";
import type {
  BookshelfInput,
  LevelInput,
  ListLocationsInput,
  ReorderInput,
  RoomInput,
  UpdateBookshelfInput,
  UpdateLevelInput,
  UpdateRoomInput,
} from "../validation/location";

export async function listLocations(input: ListLocationsInput = { includeSlots: true }, db: PrismaClient = defaultPrisma) {
  const includeSlots = input.includeSlots ?? true;

  const levels = await db.houseLevel.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      rooms: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          bookshelves: {
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            include: {
              slots: {
                orderBy: [{ rowIndex: "asc" }, { depthIndex: "asc" }],
              },
            },
          },
        },
      },
    },
  });

  if (!includeSlots) {
    return levels.map((level) => ({
      ...level,
      rooms: level.rooms.map((room) => ({
        ...room,
        bookshelves: room.bookshelves.map((bookshelf) => ({
          ...bookshelf,
          slots: [],
        })),
      })),
    }));
  }

  return levels;
}

async function createMissingSlots(bookshelfId: string, rowCount: number, depthCount: number, db: PrismaClient) {
  for (const slot of generateShelfSlots(rowCount, depthCount)) {
    await db.shelfSlot.upsert({
      where: {
        bookshelfId_rowIndex_depthIndex: {
          bookshelfId,
          rowIndex: slot.rowIndex,
          depthIndex: slot.depthIndex,
        },
      },
      create: { bookshelfId, rowIndex: slot.rowIndex, depthIndex: slot.depthIndex, label: slot.label },
      update: { label: slot.label },
    });
  }
}

async function assertSlotsCanBeRemoved(bookshelfId: string, rowCount: number, depthCount: number, db: PrismaClient) {
  const slotsToRemove = await db.shelfSlot.findMany({
    where: {
      bookshelfId,
      OR: [{ rowIndex: { gt: rowCount } }, { depthIndex: { gt: depthCount } }],
    },
    select: { id: true, rowIndex: true, depthIndex: true, _count: { select: { copies: true } } },
    orderBy: [{ rowIndex: "asc" }, { depthIndex: "asc" }],
  });

  const occupiedSlot = slotsToRemove.find((slot) => slot._count.copies > 0);
  if (occupiedSlot) {
    throw new AppError(
      "CONFLICT",
      `Cannot shrink bookshelf because row ${occupiedSlot.rowIndex}, depth ${occupiedSlot.depthIndex} contains copies. Move books first.`,
      "rowCount",
    );
  }

  return slotsToRemove.map((slot) => slot.id);
}

async function assertBookshelfIsEmpty(bookshelfId: string, db: PrismaClient) {
  const occupiedCount = await db.copy.count({ where: { locationSlot: { bookshelfId } } });
  if (occupiedCount > 0) {
    throw new AppError("CONFLICT", "Cannot delete an occupied bookshelf. Move books first.");
  }
}

async function assertRoomIsEmpty(roomId: string, db: PrismaClient) {
  const occupiedCount = await db.copy.count({ where: { locationSlot: { bookshelf: { roomId } } } });
  if (occupiedCount > 0) {
    throw new AppError("CONFLICT", "Cannot delete a room with occupied shelf slots. Move books first.");
  }
}

async function assertLevelIsEmpty(levelId: string, db: PrismaClient) {
  const occupiedCount = await db.copy.count({ where: { locationSlot: { bookshelf: { room: { levelId } } } } });
  if (occupiedCount > 0) {
    throw new AppError("CONFLICT", "Cannot delete a level with occupied shelf slots. Move books first.");
  }
}

export async function getLocationSummary(db: PrismaClient = defaultPrisma) {
  const [levelCount, roomCount, bookshelfCount, slotCount] = await Promise.all([
    db.houseLevel.count(),
    db.room.count(),
    db.bookshelf.count(),
    db.shelfSlot.count(),
  ]);

  return { levelCount, roomCount, bookshelfCount, slotCount };
}

export async function createLevel(input: LevelInput, db: PrismaClient = defaultPrisma) {
  return db.houseLevel.create({ data: input });
}

export async function updateLevel(input: UpdateLevelInput, db: PrismaClient = defaultPrisma) {
  const { id, ...data } = input;
  return db.houseLevel.update({ where: { id }, data });
}

export async function deleteLevel(id: string, db: PrismaClient = defaultPrisma) {
  await assertLevelIsEmpty(id, db);
  return db.houseLevel.delete({ where: { id } });
}

export async function createRoom(input: RoomInput, db: PrismaClient = defaultPrisma) {
  return db.room.create({ data: input });
}

export async function updateRoom(input: UpdateRoomInput, db: PrismaClient = defaultPrisma) {
  const { id, ...data } = input;
  return db.room.update({ where: { id }, data });
}

export async function deleteRoom(id: string, db: PrismaClient = defaultPrisma) {
  await assertRoomIsEmpty(id, db);
  return db.room.delete({ where: { id } });
}

export async function createBookshelf(input: BookshelfInput, db: PrismaClient = defaultPrisma) {
  return db.$transaction(async (tx) => {
    const bookshelf = await tx.bookshelf.create({ data: input });
    await createMissingSlots(bookshelf.id, bookshelf.rowCount, bookshelf.depthCount, tx as PrismaClient);
    return bookshelf;
  });
}

export async function updateBookshelf(input: UpdateBookshelfInput, db: PrismaClient = defaultPrisma) {
  const { id, ...data } = input;

  return db.$transaction(async (tx) => {
    const removableSlotIds = await assertSlotsCanBeRemoved(id, data.rowCount, data.depthCount, tx as PrismaClient);

    if (removableSlotIds.length > 0) {
      await tx.shelfSlot.deleteMany({ where: { id: { in: removableSlotIds } } });
    }

    const bookshelf = await tx.bookshelf.update({ where: { id }, data });
    await createMissingSlots(bookshelf.id, bookshelf.rowCount, bookshelf.depthCount, tx as PrismaClient);
    return bookshelf;
  });
}

export async function deleteBookshelf(id: string, db: PrismaClient = defaultPrisma) {
  await assertBookshelfIsEmpty(id, db);
  return db.bookshelf.delete({ where: { id } });
}

export async function reorderLevel(input: ReorderInput, db: PrismaClient = defaultPrisma) {
  const current = await db.houseLevel.findUniqueOrThrow({ where: { id: input.id }, select: { sortOrder: true } });
  const movingUp = input.direction === "up";
  const neighbor = await db.houseLevel.findFirst({
    where: { sortOrder: movingUp ? { lt: current.sortOrder } : { gt: current.sortOrder } },
    orderBy: { sortOrder: movingUp ? "desc" : "asc" },
    select: { id: true, sortOrder: true },
  });
  if (!neighbor) return { changed: false };
  await db.$transaction([
    db.houseLevel.update({ where: { id: input.id }, data: { sortOrder: neighbor.sortOrder } }),
    db.houseLevel.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
  ]);
  return { changed: true };
}

export async function reorderRoom(input: ReorderInput, db: PrismaClient = defaultPrisma) {
  const room = await db.room.findUniqueOrThrow({ where: { id: input.id }, select: { levelId: true } });
  const current = await db.room.findUniqueOrThrow({ where: { id: input.id }, select: { sortOrder: true } });
  const movingUp = input.direction === "up";
  const neighbor = await db.room.findFirst({
    where: { levelId: room.levelId, sortOrder: movingUp ? { lt: current.sortOrder } : { gt: current.sortOrder } },
    orderBy: { sortOrder: movingUp ? "desc" : "asc" },
    select: { id: true, sortOrder: true },
  });
  if (!neighbor) return { changed: false };
  await db.$transaction([
    db.room.update({ where: { id: input.id }, data: { sortOrder: neighbor.sortOrder } }),
    db.room.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
  ]);
  return { changed: true };
}

export async function reorderBookshelf(input: ReorderInput, db: PrismaClient = defaultPrisma) {
  const bookshelf = await db.bookshelf.findUniqueOrThrow({ where: { id: input.id }, select: { roomId: true } });
  const current = await db.bookshelf.findUniqueOrThrow({ where: { id: input.id }, select: { sortOrder: true } });
  const movingUp = input.direction === "up";
  const neighbor = await db.bookshelf.findFirst({
    where: { roomId: bookshelf.roomId, sortOrder: movingUp ? { lt: current.sortOrder } : { gt: current.sortOrder } },
    orderBy: { sortOrder: movingUp ? "desc" : "asc" },
    select: { id: true, sortOrder: true },
  });
  if (!neighbor) return { changed: false };
  await db.$transaction([
    db.bookshelf.update({ where: { id: input.id }, data: { sortOrder: neighbor.sortOrder } }),
    db.bookshelf.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
  ]);
  return { changed: true };
}
