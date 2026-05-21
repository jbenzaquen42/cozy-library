import { prisma } from "@/lib/db/prisma";
import type {
  BackupV1,
  ExportedBook,
  ExportedBookcase,
  ExportedCopy,
  ExportedLevel,
  ExportedRoom,
  ExportedSlot,
} from "@/lib/validation/importExport";

export async function buildBackupV1(options: { includeMetadata: boolean }): Promise<BackupV1> {
  // Query all data in parallel
  const [levels, rooms, bookshelves, slots, books, copies] = await Promise.all([
    prisma.houseLevel.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.room.findMany({ orderBy: { sortOrder: "asc" }, include: { level: { select: { sceneKey: true } } } }),
    prisma.bookshelf.findMany({ orderBy: { sortOrder: "asc" }, include: { room: { select: { sceneKey: true } } } }),
    prisma.shelfSlot.findMany({ orderBy: [{ rowIndex: "asc" }, { depthIndex: "asc" }], include: { bookshelf: { select: { sceneKey: true } } } }),
    prisma.book.findMany({ orderBy: [{ title: "asc" }, { displayAuthor: "asc" }] }),
    prisma.copy.findMany({
      orderBy: [{ copyLabel: "asc" }],
      include: {
        book: { select: { isbn13: true, title: true } },
        locationSlot: { include: { bookshelf: { select: { sceneKey: true } } } },
      },
    }),
  ]);

  const exportedLevels: ExportedLevel[] = levels.map((l) => ({
    sceneKey: l.sceneKey,
    name: l.name,
    sortOrder: l.sortOrder,
  }));

  const exportedRooms: ExportedRoom[] = rooms.map((r) => ({
    sceneKey: r.sceneKey,
    levelSceneKey: r.level.sceneKey,
    name: r.name,
    sortOrder: r.sortOrder,
  }));

  const exportedBookcases: ExportedBookcase[] = bookshelves.map((b) => ({
    sceneKey: b.sceneKey,
    roomSceneKey: b.room.sceneKey,
    name: b.name,
    rowCount: b.rowCount,
    depthCount: b.depthCount,
    sortOrder: b.sortOrder,
    widthUnits: b.widthUnits,
    presetName: b.presetName ?? undefined,
    widthMeters: b.widthMeters ?? undefined,
    heightMeters: b.heightMeters ?? undefined,
    depthMeters: b.depthMeters ?? undefined,
    positionX: b.positionX ?? undefined,
    positionY: b.positionY ?? undefined,
    positionZ: b.positionZ ?? undefined,
    rotationX: b.rotationX ?? undefined,
    rotationY: b.rotationY ?? undefined,
    rotationZ: b.rotationZ ?? undefined,
    frameColor: b.frameColor ?? undefined,
    shelfColor: b.shelfColor ?? undefined,
    trimColor: b.trimColor ?? undefined,
    notes: b.notes ?? undefined,
  }));

  const exportedSlots: ExportedSlot[] = slots.map((s) => ({
    bookcaseSceneKey: s.bookshelf.sceneKey,
    rowIndex: s.rowIndex,
    depthIndex: s.depthIndex,
    label: s.label,
  }));

  const exportedBooks: ExportedBook[] = books.map((b) => {
    const book: ExportedBook = {
      title: b.title,
      subtitle: b.subtitle ?? undefined,
      displayAuthor: b.displayAuthor,
      isbn10: b.isbn10 ?? undefined,
      isbn13: b.isbn13 ?? undefined,
      publisher: b.publisher ?? undefined,
      publishedDate: b.publishedDate ?? undefined,
      pageCount: b.pageCount ?? undefined,
      language: b.language ?? undefined,
      description: b.description ?? undefined,
      categories: Array.isArray(b.categories) ? (b.categories as string[]) : [],
      seriesName: b.seriesName ?? undefined,
      seriesNumber: b.seriesNumber ?? undefined,
      spineColor: b.spineColor ?? undefined,
      coverImagePath: b.coverImagePath ?? undefined,
      createdAt: b.createdAt.toISOString(),
    };
    if (options.includeMetadata) {
      book.metadataJson = b.metadataJson;
      book.metadataSource = b.metadataSource ?? undefined;
    }
    return book;
  });

  const exportedCopies: ExportedCopy[] = copies.map((c) => ({
    bookIsbn13: c.book.isbn13 ?? undefined,
    bookTitle: c.book.title,
    copyLabel: c.copyLabel,
    bookcaseSceneKey: c.locationSlot?.bookshelf.sceneKey ?? undefined,
    rowIndex: c.locationSlot?.rowIndex ?? undefined,
    depthIndex: c.locationSlot?.depthIndex ?? undefined,
    shelfPosition: c.shelfPosition ?? undefined,
    spineColor: c.spineColor ?? undefined,
    condition: c.condition ?? undefined,
    notes: c.notes ?? undefined,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  }));

  return {
    schemaVersion: 1 as const,
    exportedAt: new Date().toISOString(),
    app: { name: "cozy-library", version: "0.1.0" },
    options: { includeMetadata: options.includeMetadata },
    home: {
      levels: exportedLevels,
      rooms: exportedRooms,
      bookcases: exportedBookcases,
      slots: exportedSlots,
    },
    books: exportedBooks,
    copies: exportedCopies,
  };
}
