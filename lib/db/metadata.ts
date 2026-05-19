import type { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { AppError } from "../errors";
import { cacheCoverImage } from "../metadata/covers";
import { mergeMetadataIntoBook } from "../metadata/merge";
import { lookupGoogleBooks, lookupHardcover, lookupIsbnDb, lookupOpenLibrary } from "../metadata/providers";
import type { MetadataLookupInput, MetadataLookupResult, MetadataProvider } from "../metadata/types";
import { prisma as defaultPrisma } from "./prisma";

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
  const updateData: Prisma.BookUpdateInput = {
    ...(merged.patch as Prisma.BookUpdateInput),
    metadataSource: merged.metadataSource,
    metadataJson: JSON.parse(JSON.stringify(merged.metadataJson)) as Prisma.InputJsonValue,
    coverImagePath: cover?.publicPath ?? book.coverImagePath,
    ...(cover
      ? {
          images: {
            create: { kind: "CACHED_COVER", filePath: cover.filePath, mimeType: cover.mimeType, sourceUrl: cover.sourceUrl },
          },
        }
      : {}),
  };

  const updated = await db.book.update({
    where: { id: book.id },
    data: updateData,
  });

  return { book: updated, results, coverPath: cover?.publicPath };
}
