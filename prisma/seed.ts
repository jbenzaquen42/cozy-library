import { PrismaClient } from "@prisma/client";
import { DEFAULT_HOUSE_LAYOUT, generateShelfSlots, type ShelfSeed } from "../lib/scene/defaultSceneKeys";

const prisma = new PrismaClient();

async function safeDefaultShelfDimensions(bookshelfId: string, shelfSeed: ShelfSeed) {
  const occupiedOutOfBoundsSlots = await prisma.shelfSlot.findMany({
    where: {
      bookshelfId,
      OR: [{ rowIndex: { gt: shelfSeed.rowCount } }, { depthIndex: { gt: shelfSeed.depthCount } }],
      copies: { some: {} },
    },
    select: { rowIndex: true, depthIndex: true },
  });

  if (occupiedOutOfBoundsSlots.length === 0) {
    return { rowCount: shelfSeed.rowCount, depthCount: shelfSeed.depthCount };
  }

  const rowCount = Math.max(shelfSeed.rowCount, ...occupiedOutOfBoundsSlots.map((slot) => slot.rowIndex));
  const depthCount = Math.max(shelfSeed.depthCount, ...occupiedOutOfBoundsSlots.map((slot) => slot.depthIndex));

  console.warn(
    `Preserving expanded dimensions for ${shelfSeed.sceneKey} because occupied slots exist outside the current default layout.`,
  );

  return { rowCount, depthCount };
}

async function upsertDefaultBookshelf(roomId: string, shelfSeed: ShelfSeed) {
  const existingBookshelf = await prisma.bookshelf.findUnique({
    where: { sceneKey: shelfSeed.sceneKey },
    select: { id: true },
  });

  if (!existingBookshelf) {
    return prisma.bookshelf.create({
      data: {
        roomId,
        name: shelfSeed.name,
        sceneKey: shelfSeed.sceneKey,
        rowCount: shelfSeed.rowCount,
        depthCount: shelfSeed.depthCount,
        sortOrder: shelfSeed.sortOrder,
      },
    });
  }

  const safeDimensions = await safeDefaultShelfDimensions(existingBookshelf.id, shelfSeed);

  return prisma.bookshelf.update({
    where: { id: existingBookshelf.id },
    data: {
      roomId,
      name: shelfSeed.name,
      rowCount: safeDimensions.rowCount,
      depthCount: safeDimensions.depthCount,
      sortOrder: shelfSeed.sortOrder,
    },
  });
}

async function seedDefaultHouse() {
  for (const levelSeed of DEFAULT_HOUSE_LAYOUT) {
    const level = await prisma.houseLevel.upsert({
      where: { sceneKey: levelSeed.sceneKey },
      create: {
        name: levelSeed.name,
        sceneKey: levelSeed.sceneKey,
        sortOrder: levelSeed.sortOrder,
      },
      update: {
        name: levelSeed.name,
        sortOrder: levelSeed.sortOrder,
      },
    });

    for (const roomSeed of levelSeed.rooms) {
      const room = await prisma.room.upsert({
        where: { sceneKey: roomSeed.sceneKey },
        create: {
          levelId: level.id,
          name: roomSeed.name,
          sceneKey: roomSeed.sceneKey,
          sortOrder: roomSeed.sortOrder,
        },
        update: {
          levelId: level.id,
          name: roomSeed.name,
          sortOrder: roomSeed.sortOrder,
        },
      });

      for (const shelfSeed of roomSeed.shelves) {
        const bookshelf = await upsertDefaultBookshelf(room.id, shelfSeed);

        for (const slot of generateShelfSlots(bookshelf.rowCount, bookshelf.depthCount)) {
          await prisma.shelfSlot.upsert({
            where: {
              bookshelfId_rowIndex_depthIndex: {
                bookshelfId: bookshelf.id,
                rowIndex: slot.rowIndex,
                depthIndex: slot.depthIndex,
              },
            },
            create: {
              bookshelfId: bookshelf.id,
              rowIndex: slot.rowIndex,
              depthIndex: slot.depthIndex,
              label: slot.label,
            },
            update: {
              label: slot.label,
            },
          });
        }
      }
    }
  }
}

seedDefaultHouse()
  .then(async () => {
    const [levelCount, roomCount, bookshelfCount, slotCount] = await Promise.all([
      prisma.houseLevel.count(),
      prisma.room.count(),
      prisma.bookshelf.count(),
      prisma.shelfSlot.count(),
    ]);

    console.log(
      `Seeded default house: ${levelCount} levels, ${roomCount} rooms, ${bookshelfCount} bookshelves, ${slotCount} shelf slots.`,
    );
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
