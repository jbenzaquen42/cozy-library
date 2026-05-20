import type { MetadataLookupInput, MetadataLookupResult } from "./types";
import { readFile } from "node:fs/promises";

const DEFAULT_CONTACT_EMAIL = "local-use@cozy-library.invalid";

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function firstString(value: unknown) {
  return Array.isArray(value) ? clean(value[0]) : clean(value);
}

function isbnQuery(input: MetadataLookupInput) {
  return input.isbn?.replace(/[-\s]/g, "");
}

export async function lookupOpenLibrary(input: MetadataLookupInput): Promise<MetadataLookupResult | null> {
  const isbn = isbnQuery(input);
  if (!isbn) return null;

  const response = await fetch(`https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`, {
    headers: { "User-Agent": `CozyHomeLibrary (${process.env.APP_CONTACT_EMAIL ?? DEFAULT_CONTACT_EMAIL})` },
  });
  if (!response.ok) return null;
  const raw = (await response.json()) as Record<string, unknown>;
  const covers = Array.isArray(raw.covers) ? raw.covers : [];
  const coverId = covers[0];
  const identifiers = raw.identifiers as Record<string, unknown> | undefined;

  return {
    title: clean(raw.title),
    subtitle: clean(raw.subtitle),
    publisher: firstString(raw.publishers),
    publishedDate: clean(raw.publish_date),
    pageCount: typeof raw.number_of_pages === "number" ? raw.number_of_pages : undefined,
    isbn10: firstString(identifiers?.isbn_10) ?? (isbn.length === 10 ? isbn : undefined),
    isbn13: firstString(identifiers?.isbn_13) ?? (isbn.length === 13 ? isbn : undefined),
    coverUrl: typeof coverId === "number" ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : undefined,
    provider: "openlibrary",
    raw,
  };
}

export async function lookupGoogleBooks(input: MetadataLookupInput): Promise<MetadataLookupResult | null> {
  const isbn = isbnQuery(input);
  const query = isbn ? `isbn:${isbn}` : [input.title, input.author].filter(Boolean).join(" ");
  if (!query) return null;
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  if (key) url.searchParams.set("key", key);

  const response = await fetch(url);
  if (!response.ok) return null;
  const raw = (await response.json()) as { items?: { volumeInfo?: Record<string, unknown> }[] };
  const volume = raw.items?.[0]?.volumeInfo;
  if (!volume) return null;
  const identifiers = Array.isArray(volume.industryIdentifiers) ? volume.industryIdentifiers as { type?: string; identifier?: string }[] : [];
  const imageLinks = volume.imageLinks as Record<string, unknown> | undefined;

  return {
    title: clean(volume.title),
    subtitle: clean(volume.subtitle),
    authors: Array.isArray(volume.authors) ? volume.authors.filter((item): item is string => typeof item === "string") : undefined,
    publisher: clean(volume.publisher),
    publishedDate: clean(volume.publishedDate),
    pageCount: typeof volume.pageCount === "number" ? volume.pageCount : undefined,
    language: clean(volume.language),
    description: clean(volume.description),
    categories: Array.isArray(volume.categories) ? volume.categories.filter((item): item is string => typeof item === "string") : undefined,
    isbn10: identifiers.find((item) => item.type === "ISBN_10")?.identifier,
    isbn13: identifiers.find((item) => item.type === "ISBN_13")?.identifier,
    coverUrl: clean(imageLinks?.thumbnail)?.replace("http://", "https://"),
    provider: "googlebooks",
    raw,
  };
}

export async function lookupIsbnDb(input: MetadataLookupInput): Promise<MetadataLookupResult | null> {
  const isbn = isbnQuery(input);
  const key = process.env.ISBNDB_API_KEY;
  if (!isbn || !key) return null;
  const response = await fetch(`https://api2.isbndb.com/book/${encodeURIComponent(isbn)}`, { headers: { Authorization: key } });
  if (!response.ok) return null;
  const raw = (await response.json()) as { book?: Record<string, unknown> };
  const book = raw.book;
  if (!book) return null;

  return {
    title: clean(book.title),
    subtitle: clean(book.title_long),
    authors: Array.isArray(book.authors) ? book.authors.filter((item): item is string => typeof item === "string") : undefined,
    publisher: clean(book.publisher),
    publishedDate: clean(book.date_published),
    pageCount: typeof book.pages === "number" ? book.pages : undefined,
    language: clean(book.language),
    categories: Array.isArray(book.subjects) ? book.subjects.filter((item): item is string => typeof item === "string") : undefined,
    isbn10: clean(book.isbn),
    isbn13: clean(book.isbn13),
    coverUrl: clean(book.image),
    provider: "isbndb",
    raw,
  };
}

type HardcoverEdition = {
  title?: string | null;
  subtitle?: string | null;
  isbn_10?: string | null;
  isbn_13?: string | null;
  pages?: number | null;
  release_date?: string | null;
  publisher?: { name?: string | null } | null;
  language?: { language?: string | null } | null;
  book?: {
    title?: string | null;
    subtitle?: string | null;
    description?: string | null;
    image?: { url?: string | null } | null;
  } | null;
};

type HardcoverResponse = {
  data?: { editions?: HardcoverEdition[] };
  errors?: { message?: string }[];
};

const HARDCOVER_ISBN_QUERY = `
  query CozyLibraryEditionByIsbn($isbn10: String!, $isbn13: String!) {
    editions(
      where: {
        _or: [
          { isbn_10: { _eq: $isbn10 } }
          { isbn_13: { _eq: $isbn13 } }
        ]
      }
      limit: 1
    ) {
      title
      subtitle
      isbn_10
      isbn_13
      pages
      release_date
      publisher { name }
      language { language }
      book {
        title
        subtitle
        description
        image { url }
      }
    }
  }
`;

function parseToken(raw: string) {
  const trimmed = raw.trim();
  const value = trimmed.includes("=") ? trimmed.split("=").slice(1).join("=").trim() : trimmed;
  return value.replace(/^Bearer\s+/i, "").trim();
}

async function getHardcoverToken() {
  const envToken = process.env.HARDCOVER_API_TOKEN?.trim();
  if (envToken) return parseToken(envToken);

  const tokenPath = process.env.HARDCOVER_API_TOKEN_FILE?.trim();
  if (!tokenPath) return undefined;
  try {
    return parseToken(await readFile(tokenPath, "utf8"));
  } catch {
    return undefined;
  }
}

export async function lookupHardcover(input: MetadataLookupInput): Promise<MetadataLookupResult | null> {
  const isbn = isbnQuery(input);
  const token = await getHardcoverToken();
  if (!isbn || !token) return null;

  const response = await fetch("https://api.hardcover.app/v1/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
      "User-Agent": `CozyHomeLibrary (${process.env.APP_CONTACT_EMAIL ?? DEFAULT_CONTACT_EMAIL})`,
    },
    body: JSON.stringify({ query: HARDCOVER_ISBN_QUERY, variables: { isbn10: isbn, isbn13: isbn } }),
  });
  if (!response.ok) return null;

  const raw = (await response.json()) as HardcoverResponse;
  if (raw.errors?.length) return null;
  const edition = raw.data?.editions?.[0];
  if (!edition) return null;

  return {
    title: clean(edition.title) ?? clean(edition.book?.title),
    subtitle: clean(edition.subtitle) ?? clean(edition.book?.subtitle),
    publisher: clean(edition.publisher?.name),
    publishedDate: clean(edition.release_date),
    pageCount: typeof edition.pages === "number" ? edition.pages : undefined,
    language: clean(edition.language?.language),
    description: clean(edition.book?.description),
    isbn10: clean(edition.isbn_10) ?? (isbn.length === 10 ? isbn : undefined),
    isbn13: clean(edition.isbn_13) ?? (isbn.length === 13 ? isbn : undefined),
    coverUrl: clean(edition.book?.image?.url),
    provider: "hardcover",
    raw,
  };
}
