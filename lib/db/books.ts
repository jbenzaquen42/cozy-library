import type { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "../errors";
import type { CreateManualBookInput, UpdateBookInput } from "../validation/book";
import { prisma as defaultPrisma } from "./prisma";

export function normalizeOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function authorSortName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name.trim();
  const last = parts.at(-1);
  const rest = parts.slice(0, -1).join(" ");
  return `${last}, ${rest}`;
}

async function upsertDisplayAuthor(bookId: string, displayAuthor: string, tx: Prisma.TransactionClient) {
  await tx.bookAuthor.deleteMany({ where: { bookId } });
  const names = displayAuthor
    .split(/\s+(?:and|&)\s+|,/) 
    .map((name) => name.trim())
    .filter(Boolean);

  const authorNames = names.length > 0 ? names : [displayAuthor.trim()];

  for (const [index, name] of authorNames.entries()) {
    const author = await tx.author.upsert({
      where: { name },
      create: { name, sortName: authorSortName(name) },
      update: { sortName: authorSortName(name) },
    });
    await tx.bookAuthor.create({ data: { bookId, authorId: author.id, position: index + 1 } });
  }
}

function bookData(input: CreateManualBookInput | UpdateBookInput) {
  return {
    title: input.title.trim(),
    subtitle: normalizeOptional(input.subtitle),
    displayAuthor: input.displayAuthor.trim(),
    isbn10: normalizeOptional(input.isbn10),
    isbn13: normalizeOptional(input.isbn13),
    publisher: normalizeOptional(input.publisher),
    publishedDate: normalizeOptional(input.publishedDate),
    pageCount: input.pageCount ?? null,
    language: normalizeOptional(input.language),
    description: normalizeOptional(input.description),
    seriesName: normalizeOptional(input.seriesName),
    seriesNumber: normalizeOptional(input.seriesNumber),
  };
}

export function getBookInclude() {
  return {
    authors: { include: { author: true }, orderBy: { position: "asc" as const } },
    copies: {
      orderBy: { copyLabel: "asc" as const },
      include: {
        loans: { orderBy: { dateLoaned: "desc" as const } },
        locationSlot: {
          include: { bookshelf: { include: { room: { include: { level: true } } } } },
        },
      },
    },
  };
}

export async function listBooks(db: PrismaClient = defaultPrisma) {
  return db.book.findMany({ orderBy: [{ updatedAt: "desc" }, { title: "asc" }], include: getBookInclude() });
}

export async function getBook(id: string, db: PrismaClient = defaultPrisma) {
  const book = await db.book.findUnique({ where: { id }, include: getBookInclude() });
  if (!book) throw new AppError("NOT_FOUND", "Book not found");
  return book;
}

export async function createManualBook(input: CreateManualBookInput, db: PrismaClient = defaultPrisma) {
  return db.$transaction(async (tx) => {
    const slot = await tx.shelfSlot.findUnique({ where: { id: input.locationSlotId } });
    if (!slot) throw new AppError("NOT_FOUND", "Shelf slot not found", "locationSlotId");

    const book = await tx.book.create({ data: bookData(input) });
    await upsertDisplayAuthor(book.id, input.displayAuthor, tx);
    await tx.copy.create({
      data: {
        bookId: book.id,
        copyLabel: "1",
        locationSlotId: input.locationSlotId,
        condition: normalizeOptional(input.condition),
        notes: normalizeOptional(input.notes),
      },
    });

    return tx.book.findUniqueOrThrow({ where: { id: book.id }, include: getBookInclude() });
  });
}

export async function updateBook(input: UpdateBookInput, db: PrismaClient = defaultPrisma) {
  const { id } = input;
  return db.$transaction(async (tx) => {
    await tx.book.update({ where: { id }, data: bookData(input) });
    await upsertDisplayAuthor(id, input.displayAuthor, tx);
    return tx.book.findUniqueOrThrow({ where: { id }, include: getBookInclude() });
  });
}

export async function deleteBookIfNoCopies(id: string, db: PrismaClient = defaultPrisma) {
  const copyCount = await db.copy.count({ where: { bookId: id } });
  if (copyCount > 0) throw new AppError("CONFLICT", "Delete copies before deleting this book.");
  return db.book.delete({ where: { id } });
}
