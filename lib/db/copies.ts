import type { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";
import type { CopyInput, MoveCopyInput, RenameCopyInput } from "../validation/book";
import { getBook } from "./books";
import { prisma as defaultPrisma } from "./prisma";

export async function listCopies(bookId?: string, db: PrismaClient = defaultPrisma) {
  return db.copy.findMany({
    where: bookId ? { bookId } : undefined,
    orderBy: { copyLabel: "asc" },
    include: { locationSlot: { include: { bookshelf: { include: { room: { include: { level: true } } } } } } },
  });
}

export function getNextCopyLabel(existingLabels: string[]) {
  const used = new Set(existingLabels.map((label) => Number.parseInt(label, 10)).filter((value) => Number.isInteger(value) && value > 0));
  let next = 1;
  while (used.has(next)) next += 1;
  return String(next);
}

export async function createCopy(input: CopyInput, db: PrismaClient = defaultPrisma) {
  const book = await db.book.findUnique({ where: { id: input.bookId }, include: { copies: { select: { copyLabel: true } } } });
  if (!book) throw new AppError("NOT_FOUND", "Book not found", "bookId");

  if (input.locationSlotId) {
    const slot = await db.shelfSlot.findUnique({ where: { id: input.locationSlotId } });
    if (!slot) throw new AppError("NOT_FOUND", "Shelf slot not found", "locationSlotId");
  }

  const copy = await db.copy.create({
    data: {
      bookId: input.bookId,
      copyLabel: getNextCopyLabel(book.copies.map((item) => item.copyLabel)),
      locationSlotId: input.locationSlotId ?? null,
      condition: input.condition ?? null,
      notes: input.notes ?? null,
    },
  });

  return copy;
}

export async function listUnshelvedCopies(db: PrismaClient = defaultPrisma) {
  return db.copy.findMany({
    where: { locationSlotId: null },
    orderBy: [{ createdAt: "desc" }, { copyLabel: "asc" }],
    include: { book: { select: { id: true, title: true, displayAuthor: true, isbn10: true, isbn13: true } } },
  });
}

export async function renameCopy(input: RenameCopyInput, db: PrismaClient = defaultPrisma) {
  const copy = await db.copy.findUnique({ where: { id: input.id } });
  if (!copy) throw new AppError("NOT_FOUND", "Copy not found");

  const duplicate = await db.copy.findFirst({
    where: { bookId: copy.bookId, copyLabel: input.copyLabel, NOT: { id: input.id } },
  });
  if (duplicate) throw new AppError("CONFLICT", "That copy label is already used for this book.", "copyLabel");

  return db.copy.update({ where: { id: input.id }, data: { copyLabel: input.copyLabel } });
}

export async function moveCopy(input: MoveCopyInput, db: PrismaClient = defaultPrisma) {
  if (input.locationSlotId) {
    const slot = await db.shelfSlot.findUnique({ where: { id: input.locationSlotId } });
    if (!slot) throw new AppError("NOT_FOUND", "Shelf slot not found", "locationSlotId");
  }
  return db.copy.update({ where: { id: input.id }, data: { locationSlotId: input.locationSlotId ?? null } });
}

export async function deleteCopy(id: string, db: PrismaClient = defaultPrisma) {
  const copy = await db.copy.findUnique({ where: { id } });
  if (!copy) throw new AppError("NOT_FOUND", "Copy not found");
  if (copy.status === "LOANED") throw new AppError("CONFLICT", "Return this copy before deleting it.");
  return db.copy.delete({ where: { id } });
}

export async function getBookAfterCopyChange(bookId: string, db: PrismaClient = defaultPrisma) {
  return getBook(bookId, db);
}
