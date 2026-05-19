import { PrismaClient } from "@prisma/client";
import { DEFAULT_HOUSE_LAYOUT, generateShelfSlots } from "../lib/scene/defaultSceneKeys";

const prisma = new PrismaClient();

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
        const bookshelf = await prisma.bookshelf.upsert({
          where: { sceneKey: shelfSeed.sceneKey },
          create: {
            roomId: room.id,
            name: shelfSeed.name,
            sceneKey: shelfSeed.sceneKey,
            rowCount: shelfSeed.rowCount,
            depthCount: shelfSeed.depthCount,
            sortOrder: shelfSeed.sortOrder,
          },
          update: {
            roomId: room.id,
            name: shelfSeed.name,
            rowCount: shelfSeed.rowCount,
            depthCount: shelfSeed.depthCount,
            sortOrder: shelfSeed.sortOrder,
          },
        });

        for (const slot of generateShelfSlots(shelfSeed.rowCount, shelfSeed.depthCount)) {
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
