import { prisma as defaultPrisma } from "./prisma";
import type { PrismaClient } from "@prisma/client";

export type HouseBrowserCopy = {
  id: string;
  copyLabel: string;
  status: string;
  bookId: string;
  title: string;
  displayAuthor: string;
};

export type HouseBrowserSlot = {
  id: string;
  rowIndex: number;
  depthIndex: number;
  label: string;
  copies: HouseBrowserCopy[];
};

export type HouseBrowserShelf = {
  id: string;
  name: string;
  sceneKey: string;
  rowCount: number;
  depthCount: number;
  roomName: string;
  levelName: string;
  slots: HouseBrowserSlot[];
};

export type HouseBrowserRoom = {
  id: string;
  name: string;
  sceneKey: string;
  levelName: string;
  shelves: HouseBrowserShelf[];
};

export type HouseBrowserLevel = {
  id: string;
  name: string;
  sceneKey: string;
  rooms: HouseBrowserRoom[];
};

export async function getHouseBrowserData(db: PrismaClient = defaultPrisma): Promise<HouseBrowserLevel[]> {
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
                include: {
                  copies: {
                    orderBy: { copyLabel: "asc" },
                    include: { book: { select: { id: true, title: true, displayAuthor: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return levels.map((level) => ({
    id: level.id,
    name: level.name,
    sceneKey: level.sceneKey,
    rooms: level.rooms.map((room) => ({
      id: room.id,
      name: room.name,
      sceneKey: room.sceneKey,
      levelName: level.name,
      shelves: room.bookshelves.map((shelf) => ({
        id: shelf.id,
        name: shelf.name,
        sceneKey: shelf.sceneKey,
        rowCount: shelf.rowCount,
        depthCount: shelf.depthCount,
        roomName: room.name,
        levelName: level.name,
        slots: shelf.slots.map((slot) => ({
          id: slot.id,
          rowIndex: slot.rowIndex,
          depthIndex: slot.depthIndex,
          label: slot.label,
          copies: slot.copies.map((copy) => ({
            id: copy.id,
            copyLabel: copy.copyLabel,
            status: copy.status,
            bookId: copy.book.id,
            title: copy.book.title,
            displayAuthor: copy.book.displayAuthor,
          })),
        })),
      })),
    })),
  }));
}
