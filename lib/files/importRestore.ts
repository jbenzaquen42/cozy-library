import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db/prisma";
import { upsertDisplayAuthor } from "@/lib/db/books";
import { generateShelfSlots } from "@/lib/scene/defaultSceneKeys";
import type { BackupV1 } from "@/lib/validation/importExport";

export type RestoreResult = {
  success: boolean;
  levelsCreated: number;
  roomsCreated: number;
  bookcasesCreated: number;
  slotsCreated: number;
  booksCreated: number;
  copiesCreated: number;
  errors: string[];
};

export async function restoreBackupV1(
  backup: BackupV1,
  db: PrismaClient = defaultPrisma,
): Promise<RestoreResult> {
  const result: RestoreResult = {
    success: false,
    levelsCreated: 0,
    roomsCreated: 0,
    bookcasesCreated: 0,
    slotsCreated: 0,
    booksCreated: 0,
    copiesCreated: 0,
    errors: [],
  };

  try {
    await db.$transaction(async (tx) => {
      // 1. Delete existing data in reverse dependency order
      await tx.loan.deleteMany({});
      await tx.copy.deleteMany({});
      await tx.bookAuthor.deleteMany({});
      await tx.author.deleteMany({});
      await tx.uploadedImage.deleteMany({});
      await tx.book.deleteMany({});
      await tx.shelfSlot.deleteMany({});
      await tx.bookshelf.deleteMany({});
      await tx.room.deleteMany({});
      await tx.houseLevel.deleteMany({});
      await tx.metadataCache.deleteMany({});

      // 2. Create levels
      const levelIdMap = new Map<string, string>(); // sceneKey -> new id
      for (const level of backup.home.levels) {
        const created = await tx.houseLevel.create({
          data: {
            name: level.name,
            sceneKey: level.sceneKey,
            sortOrder: level.sortOrder,
          },
        });
        levelIdMap.set(level.sceneKey, created.id);
        result.levelsCreated++;
      }

      // 3. Create rooms
      const roomIdMap = new Map<string, string>();
      for (const room of backup.home.rooms) {
        const levelId = levelIdMap.get(room.levelSceneKey);
        if (!levelId) {
          result.errors.push(
            `Room "${room.name}" references unknown level "${room.levelSceneKey}"`,
          );
          continue;
        }
        const created = await tx.room.create({
          data: {
            levelId,
            name: room.name,
            sceneKey: room.sceneKey,
            sortOrder: room.sortOrder,
          },
        });
        roomIdMap.set(room.sceneKey, created.id);
        result.roomsCreated++;
      }

      // 4. Create bookcases and their slots
      const bookcaseIdMap = new Map<string, string>();
      const slotIdMap = new Map<string, string>(); // "bookcaseSceneKey:rowIndex:depthIndex" -> new slot id
      for (const bookcase of backup.home.bookcases) {
        const roomId = roomIdMap.get(bookcase.roomSceneKey);
        if (!roomId) {
          result.errors.push(
            `Bookcase "${bookcase.name}" references unknown room "${bookcase.roomSceneKey}"`,
          );
          continue;
        }
        const created = await tx.bookshelf.create({
          data: {
            roomId,
            name: bookcase.name,
            sceneKey: bookcase.sceneKey,
            rowCount: bookcase.rowCount,
            depthCount: bookcase.depthCount,
            sortOrder: bookcase.sortOrder,
            widthUnits: bookcase.widthUnits ?? 1,
            presetName: bookcase.presetName ?? null,
            widthMeters: bookcase.widthMeters ?? null,
            heightMeters: bookcase.heightMeters ?? null,
            depthMeters: bookcase.depthMeters ?? null,
            positionX: bookcase.positionX ?? null,
            positionY: bookcase.positionY ?? null,
            positionZ: bookcase.positionZ ?? null,
            rotationX: bookcase.rotationX ?? null,
            rotationY: bookcase.rotationY ?? null,
            rotationZ: bookcase.rotationZ ?? null,
            frameColor: bookcase.frameColor ?? null,
            shelfColor: bookcase.shelfColor ?? null,
            trimColor: bookcase.trimColor ?? null,
            notes: bookcase.notes ?? null,
          },
        });
        bookcaseIdMap.set(bookcase.sceneKey, created.id);

        // Generate slots for this bookcase
        const slotDefs = generateShelfSlots(bookcase.rowCount, bookcase.depthCount);
        for (const slotDef of slotDefs) {
          const slot = await tx.shelfSlot.create({
            data: {
              bookshelfId: created.id,
              rowIndex: slotDef.rowIndex,
              depthIndex: slotDef.depthIndex,
              label: slotDef.label,
            },
          });
          slotIdMap.set(
            `${bookcase.sceneKey}:${slotDef.rowIndex}:${slotDef.depthIndex}`,
            slot.id,
          );
          result.slotsCreated++;
        }
      }

      // Also create slots from the backup's explicit slot list (in case they differ from generated)
      for (const slot of backup.home.slots) {
        const bookcaseId = bookcaseIdMap.get(slot.bookcaseSceneKey);
        if (!bookcaseId) continue; // already warned
        const key = `${slot.bookcaseSceneKey}:${slot.rowIndex}:${slot.depthIndex}`;
        if (!slotIdMap.has(key)) {
          const created = await tx.shelfSlot.create({
            data: {
              bookshelfId: bookcaseId,
              rowIndex: slot.rowIndex,
              depthIndex: slot.depthIndex,
              label: slot.label,
            },
          });
          slotIdMap.set(key, created.id);
          result.slotsCreated++;
        } else {
          // Update label if different
          await tx.shelfSlot.updateMany({
            where: {
              bookshelfId: bookcaseId,
              rowIndex: slot.rowIndex,
              depthIndex: slot.depthIndex,
            },
            data: { label: slot.label },
          });
        }
      }

      // 5. Create books
      const bookIdMap = new Map<string, string>(); // "isbn:..." or "title:..." -> new id
      for (const book of backup.books) {
        const created = await tx.book.create({
          data: {
            title: book.title,
            subtitle: book.subtitle ?? null,
            displayAuthor: book.displayAuthor,
            isbn10: book.isbn10 ?? null,
            isbn13: book.isbn13 ?? null,
            publisher: book.publisher ?? null,
            publishedDate: book.publishedDate ?? null,
            pageCount: book.pageCount ?? null,
            language: book.language ?? null,
            description: book.description ?? null,
            categories: book.categories ?? [],
            seriesName: book.seriesName ?? null,
            seriesNumber: book.seriesNumber ?? null,
            coverImagePath: book.coverImagePath ?? null,
            spineColor: book.spineColor ?? null,
            metadataJson: book.metadataJson ?? {},
            metadataSource: book.metadataSource ?? null,
          },
        });

        // Use isbn13 as primary key for copy matching, fallback to title
        if (book.isbn13) {
          bookIdMap.set(`isbn:${book.isbn13}`, created.id);
        }
        bookIdMap.set(`title:${book.title}:${book.displayAuthor}`, created.id);

        // Create Author/BookAuthor records
        await upsertDisplayAuthor(created.id, book.displayAuthor, tx as Parameters<typeof upsertDisplayAuthor>[2]);
        result.booksCreated++;
      }

      // 6. Create copies
      for (const copy of backup.copies) {
        // Find the book by isbn13 or title
        let bookId = copy.bookIsbn13
          ? bookIdMap.get(`isbn:${copy.bookIsbn13}`)
          : undefined;

        if (!bookId) {
          // Fallback: search by title prefix
          for (const [key, id] of bookIdMap.entries()) {
            if (key.startsWith(`title:${copy.bookTitle}:`)) {
              bookId = id;
              break;
            }
          }
        }

        if (!bookId) {
          result.errors.push(
            `Copy of "${copy.bookTitle}" references a book that was not created`,
          );
          continue;
        }

        // Find the slot
        let locationSlotId: string | null = null;
        if (
          copy.bookcaseSceneKey &&
          copy.rowIndex != null &&
          copy.depthIndex != null
        ) {
          const slotKey = `${copy.bookcaseSceneKey}:${copy.rowIndex}:${copy.depthIndex}`;
          locationSlotId = slotIdMap.get(slotKey) ?? null;
        }

        await tx.copy.create({
          data: {
            bookId,
            copyLabel: copy.copyLabel,
            locationSlotId,
            shelfPosition: copy.shelfPosition ?? null,
            spineColor: copy.spineColor ?? null,
            condition: copy.condition ?? null,
            notes: copy.notes ?? null,
            status: copy.status,
          },
        });
        result.copiesCreated++;
      }
    });

    result.success = true;
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : "Restore failed",
    );
    result.success = false;
  }

  return result;
}
