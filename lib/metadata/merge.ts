import type { Book } from "@prisma/client";
import type { MetadataLookupResult } from "./types";

export function mergeMetadataIntoBook(book: Book, results: MetadataLookupResult[]) {
  const patch: Partial<Book> = {};
  const sources: string[] = [];
  const fill = <K extends keyof Book>(field: K, value: Book[K] | undefined) => {
    if ((book[field] === null || book[field] === "" || book[field] === undefined) && value !== undefined && value !== null && value !== "") {
      patch[field] = value;
    }
  };

  for (const result of results) {
    sources.push(result.provider);
    fill("title", result.title as Book["title"] | undefined);
    fill("subtitle", result.subtitle as Book["subtitle"] | undefined);
    fill("displayAuthor", result.authors?.join(", ") as Book["displayAuthor"] | undefined);
    fill("isbn10", result.isbn10 as Book["isbn10"] | undefined);
    fill("isbn13", result.isbn13 as Book["isbn13"] | undefined);
    fill("publisher", result.publisher as Book["publisher"] | undefined);
    fill("publishedDate", result.publishedDate as Book["publishedDate"] | undefined);
    fill("pageCount", result.pageCount as Book["pageCount"] | undefined);
    fill("language", result.language as Book["language"] | undefined);
    fill("description", result.description as Book["description"] | undefined);
    if (Array.isArray(book.categories) && book.categories.length === 0 && result.categories?.length) {
      patch.categories = result.categories as Book["categories"];
    }
  }

  return {
    patch,
    metadataSource: Array.from(new Set(sources)).join(","),
    metadataJson: { refreshedAt: new Date().toISOString(), sources: results.map((result) => ({ provider: result.provider, raw: result.raw })) },
  };
}
