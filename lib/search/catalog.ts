import type { PrismaClient } from "@prisma/client";
import { getBookInclude } from "../db/books";
import { prisma as defaultPrisma } from "../db/prisma";
import { CATALOG_PAGE_SIZE, type SearchInput } from "../validation/search";

type SearchableBook = {
  title: string;
  displayAuthor: string;
  isbn10?: string | null;
  isbn13?: string | null;
  categories?: unknown;
  copies?: {
    notes?: string | null;
    status?: string;
    locationSlot?: {
      rowIndex: number;
      depthIndex: number;
      bookshelf: {
        name: string;
        sceneKey: string;
        room: {
          name: string;
          sceneKey: string;
          level: { name: string; sceneKey: string };
        };
      };
    } | null;
  }[];
};

type CatalogSearchItem<TBook> = {
  book: TBook;
  rank: number;
};

export type CatalogSearchResults<TBook> = {
  items: CatalogSearchItem<TBook>[];
  totalCount: number;
  shownCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
};

function text(value: string | null | undefined) {
  return value?.toLowerCase().trim() ?? "";
}

function categories(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function rankCatalogBook(book: SearchableBook, rawQuery: string) {
  const query = text(rawQuery);
  if (!query) return 100;

  const title = text(book.title);
  const author = text(book.displayAuthor);
  const isbn10 = text(book.isbn10);
  const isbn13 = text(book.isbn13);
  const categoryText = categories(book.categories).join(" ").toLowerCase();
  const locationText = (book.copies ?? [])
    .map((copy) =>
      [
        copy.locationSlot?.bookshelf.name,
        copy.locationSlot?.bookshelf.sceneKey,
        copy.locationSlot?.bookshelf.room.name,
        copy.locationSlot?.bookshelf.room.sceneKey,
        copy.locationSlot?.bookshelf.room.level.name,
        copy.locationSlot?.bookshelf.room.level.sceneKey,
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join(" ")
    .toLowerCase();
  const notes = (book.copies ?? []).map((copy) => copy.notes ?? "").join(" ").toLowerCase();

  if (query === isbn10 || query === isbn13) return 1;
  if (title === query) return 2;
  if (title.startsWith(query)) return 3;
  if (title.includes(query)) return 4;
  if (author.includes(query)) return 5;
  if (categoryText.includes(query)) return 6;
  if (locationText.includes(query)) return 7;
  if (notes.includes(query)) return 8;
  return Number.POSITIVE_INFINITY;
}

export function matchesCatalogFilters(book: SearchableBook, input: SearchInput) {
  if (input.author && !text(book.displayAuthor).includes(text(input.author))) return false;
  if (input.category && !categories(book.categories).some((category) => text(category).includes(text(input.category)))) return false;

  const copies = book.copies ?? [];
  if (input.availability === "available" && !copies.some((copy) => copy.status === "AVAILABLE")) return false;
  if (input.availability === "loaned" && !copies.some((copy) => copy.status === "LOANED")) return false;

  const hasLocationFilter = Boolean(
    input.levelSceneKey || input.roomSceneKey || input.bookshelfSceneKey || input.rowIndex || input.depthIndex,
  );
  if (!hasLocationFilter) return true;

  return copies.some((copy) => {
    const slot = copy.locationSlot;
    if (!slot) return false;
    if (input.levelSceneKey && slot.bookshelf.room.level.sceneKey !== input.levelSceneKey) return false;
    if (input.roomSceneKey && slot.bookshelf.room.sceneKey !== input.roomSceneKey) return false;
    if (input.bookshelfSceneKey && slot.bookshelf.sceneKey !== input.bookshelfSceneKey) return false;
    if (input.rowIndex && slot.rowIndex !== input.rowIndex) return false;
    if (input.depthIndex && slot.depthIndex !== input.depthIndex) return false;
    return true;
  });
}

export function paginateCatalogItems<TBook>(items: CatalogSearchItem<TBook>[], page: number, pageSize = CATALOG_PAGE_SIZE): CatalogSearchResults<TBook> {
  const normalizedPage = Math.max(1, Math.floor(page));
  const normalizedPageSize = Math.max(1, Math.floor(pageSize));
  const shownCount = Math.min(items.length, normalizedPage * normalizedPageSize);

  return {
    items: items.slice(0, shownCount),
    totalCount: items.length,
    shownCount,
    page: normalizedPage,
    pageSize: normalizedPageSize,
    hasNextPage: shownCount < items.length,
  };
}

export async function searchCatalog(input: SearchInput, db: PrismaClient = defaultPrisma) {
  const books = await db.book.findMany({ include: getBookInclude(), orderBy: [{ updatedAt: "desc" }, { title: "asc" }] });
  const query = input.query.trim();

  const rankedBooks = books
    .map((book) => ({ book, rank: rankCatalogBook(book, query) }))
    .filter(({ book, rank }) => (query ? Number.isFinite(rank) : true) && matchesCatalogFilters(book, input))
    .sort((left, right) => left.rank - right.rank || left.book.title.localeCompare(right.book.title));

  return paginateCatalogItems(rankedBooks, input.page);
}
