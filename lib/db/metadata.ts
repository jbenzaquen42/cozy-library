import type { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { AppError } from "../errors";
import { cacheCoverImage } from "../metadata/covers";
import { mergeMetadataIntoBook } from "../metadata/merge";
import { lookupGoogleBooks, lookupHardcover, lookupIsbnDb, lookupOpenLibrary } from "../metadata/providers";
import type { MetadataLookupInput, MetadataLookupResult, MetadataProvider } from "../metadata/types";
import { prisma as defaultPrisma } from "./prisma";
import { upsertDisplayAuthor } from "./books";

function lookupKey(input: MetadataLookupInput) {
  return input.isbn?.replace(/[-\s]/g, "") || [input.title, input.author].filter(Boolean).join("|").toLowerCase();
}

async function cachedOrFetch(
  provider: MetadataProvider,
  input: MetadataLookupInput,
  fetcher: (input: MetadataLookupInput) => Promise<MetadataLookupResult | null>,
  db: PrismaClient,
) {
  const key = lookupKey(input);
  if (!key) return null;
  const cached = await db.metadataCache.findUnique({ where: { provider_lookupKey: { provider, lookupKey: key } } });
  if (cached) return cached.responseJson as MetadataLookupResult;

  const result = await fetcher(input);
  if (!result) return null;
  const responseJson = JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue;
  await db.metadataCache.upsert({
    where: { provider_lookupKey: { provider, lookupKey: key } },
    create: { provider, lookupKey: key, responseJson },
    update: { responseJson },
  });
  return result;
}

export async function lookupMetadata(input: MetadataLookupInput, db: PrismaClient = defaultPrisma) {
  const results = await Promise.allSettled([
    cachedOrFetch("openlibrary", input, lookupOpenLibrary, db),
    cachedOrFetch("googlebooks", input, lookupGoogleBooks, db),
    cachedOrFetch("isbndb", input, lookupIsbnDb, db),
    cachedOrFetch("hardcover", input, lookupHardcover, db),
  ]);

  return results.flatMap((result) => (result.status === "fulfilled" && result.value ? [result.value] : []));
}

export async function refreshBookMetadata(bookId: string, db: PrismaClient = defaultPrisma) {
  const book = await db.book.findUnique({ where: { id: bookId } });
  if (!book) throw new AppError("NOT_FOUND", "Book not found");

  const results = await lookupMetadata({ isbn: book.isbn13 ?? book.isbn10 ?? undefined, title: book.title, author: book.displayAuthor }, db);
  if (results.length === 0) throw new AppError("NOT_FOUND", "No metadata providers returned a result.");

  const merged = mergeMetadataIntoBook(book, results);
  const coverResult = results.find((result) => result.coverUrl);
  const cover = await cacheCoverImage(book.id, coverResult?.coverUrl);
  const p = merged.patch;

  const updateData: Prisma.BookUpdateInput = {
    ...(p.title !== undefined ? { title: p.title } : {}),
    ...(p.subtitle !== undefined ? { subtitle: p.subtitle } : {}),
    ...(p.displayAuthor !== undefined ? { displayAuthor: p.displayAuthor } : {}),
    ...(p.isbn10 !== undefined ? { isbn10: p.isbn10 } : {}),
    ...(p.isbn13 !== undefined ? { isbn13: p.isbn13 } : {}),
    ...(p.publisher !== undefined ? { publisher: p.publisher } : {}),
    ...(p.publishedDate !== undefined ? { publishedDate: p.publishedDate } : {}),
    ...(p.pageCount !== undefined ? { pageCount: p.pageCount as number | null } : {}),
    ...(p.language !== undefined ? { language: p.language } : {}),
    ...(p.description !== undefined ? { description: p.description } : {}),
    ...(p.seriesName !== undefined ? { seriesName: p.seriesName } : {}),
    ...(p.seriesNumber !== undefined ? { seriesNumber: p.seriesNumber } : {}),
    ...(p.categories !== undefined ? { categories: p.categories as Prisma.InputJsonValue } : {}),
    metadataSource: merged.metadataSource,
    metadataJson: JSON.parse(JSON.stringify(merged.metadataJson)) as Prisma.InputJsonValue,
    coverImagePath: cover?.publicPath ?? book.coverImagePath,
    ...(cover ? { images: { create: { kind: "CACHED_COVER", filePath: cover.filePath, mimeType: cover.mimeType, sourceUrl: cover.sourceUrl } } } : {}),
  };

  const updated = await db.book.update({
    where: { id: book.id },
    data: updateData,
  });

  if (p.displayAuthor !== undefined) {
    await upsertDisplayAuthor(book.id, p.displayAuthor, db as unknown as Prisma.TransactionClient);
  }

  return { book: updated, results, coverPath: cover?.publicPath };
}