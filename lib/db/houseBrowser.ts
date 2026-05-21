import { prisma as defaultPrisma } from "./prisma";
import type { PrismaClient } from "@prisma/client";

export type HouseBrowserCopy = {
  id: string;
  copyLabel: string;
  status: string;
  bookId: string;
  title: string;
  displayAuthor: string;
  spineColor: string | null;
  copySpineColor: string | null;
  coverImagePath: string | null;
  shelfPosition: number | null;
};

export type HouseBrowserUnshelvedCopy = HouseBrowserCopy & {
  createdAt: string;
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
  sortOrder: number;
  widthUnits: number;
  presetName: string | null;
  widthMeters: number | null;
  heightMeters: number | null;
  depthMeters: number | null;
  positionX: number | null;
  positionY: number | null;
  positionZ: number | null;
  rotationX: number | null;
  rotationY: number | null;
  rotationZ: number | null;
  frameColor: string | null;
  shelfColor: string | null;
  trimColor: string | null;
  notes: string | null;
  roomId: string;
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
                    orderBy: [{ shelfPosition: "asc" }, { copyLabel: "asc" }],
                    include: { book: { select: { id: true, title: true, displayAuthor: true, spineColor: true, coverImagePath: true } } },
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
        sortOrder: shelf.sortOrder,
        widthUnits: shelf.widthUnits,
        presetName: shelf.presetName,
        widthMeters: shelf.widthMeters,
        heightMeters: shelf.heightMeters,
        depthMeters: shelf.depthMeters,
        positionX: shelf.positionX,
        positionY: shelf.positionY,
        positionZ: shelf.positionZ,
        rotationX: shelf.rotationX,
        rotationY: shelf.rotationY,
        rotationZ: shelf.rotationZ,
        frameColor: shelf.frameColor,
        shelfColor: shelf.shelfColor,
        trimColor: shelf.trimColor,
        notes: shelf.notes,
        roomId: room.id,
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
            spineColor: copy.book.spineColor,
            copySpineColor: copy.spineColor,
            coverImagePath: copy.book.coverImagePath,
            shelfPosition: copy.shelfPosition,
          })),
        })),
      })),
    })),
  }));
}

export async function getHouseBrowserUnshelvedCopies(db: PrismaClient = defaultPrisma): Promise<HouseBrowserUnshelvedCopy[]> {
  return db.copy.findMany({
    where: { locationSlotId: null },
    orderBy: [{ updatedAt: "desc" }, { copyLabel: "asc" }],
    take: 24,
    include: { book: { select: { id: true, title: true, displayAuthor: true, spineColor: true, coverImagePath: true } } },
  }).then((copies) => copies.map((copy) => ({
    id: copy.id,
    copyLabel: copy.copyLabel,
    status: copy.status,
    bookId: copy.book.id,
    title: copy.book.title,
    displayAuthor: copy.book.displayAuthor,
    spineColor: copy.book.spineColor,
    copySpineColor: copy.spineColor,
    coverImagePath: copy.book.coverImagePath,
    shelfPosition: copy.shelfPosition,
    createdAt: copy.createdAt.toISOString(),
  })));
}
