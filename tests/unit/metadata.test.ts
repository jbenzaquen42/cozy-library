import { afterEach, describe, expect, it, vi } from "vitest";
import type { Book } from "@prisma/client";
import { mergeMetadataIntoBook } from "../../lib/metadata/merge";
import { lookupHardcover } from "../../lib/metadata/providers";

function book(overrides: Partial<Book> = {}): Book {
  return {
    id: "book-1",
    title: "User Title",
    subtitle: null,
    displayAuthor: "User Author",
    isbn10: null,
    isbn13: null,
    publisher: null,
    publishedDate: null,
    pageCount: null,
    language: null,
    description: null,
    categories: [],
    seriesName: null,
    seriesNumber: null,
    coverImagePath: null,
    metadataJson: {},
    metadataSource: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

describe("metadata merge", () => {
  it("fills missing fields from providers without overwriting user edits", () => {
    const merged = mergeMetadataIntoBook(book(), [
      {
        provider: "openlibrary",
        title: "Provider Title",
        subtitle: "Provider Subtitle",
        authors: ["Provider Author"],
        publisher: "Provider Press",
        isbn13: "9781234567890",
        raw: { ok: true },
      },
    ]);

    expect(merged.patch.title).toBeUndefined();
    expect(merged.patch.displayAuthor).toBeUndefined();
    expect(merged.patch.subtitle).toBe("Provider Subtitle");
    expect(merged.patch.publisher).toBe("Provider Press");
    expect(merged.patch.isbn13).toBe("9781234567890");
    expect(merged.metadataSource).toBe("openlibrary");
  });

  it("merges categories only when the book has none", () => {
    const emptyCategories = mergeMetadataIntoBook(book({ categories: [] }), [
      { provider: "googlebooks", categories: ["Fantasy"], raw: {} },
    ]);
    const existingCategories = mergeMetadataIntoBook(book({ categories: ["Owned"] }), [
      { provider: "googlebooks", categories: ["Fantasy"], raw: {} },
    ]);

    expect(emptyCategories.patch.categories).toEqual(["Fantasy"]);
    expect(existingCategories.patch.categories).toBeUndefined();
  });
});

describe("Hardcover metadata provider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.HARDCOVER_API_TOKEN;
    delete process.env.HARDCOVER_API_TOKEN_FILE;
  });

  it("maps Hardcover edition responses into metadata results", async () => {
    process.env.HARDCOVER_API_TOKEN = "test-token";
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: {
            editions: [
              {
                title: "Hardcover Title",
                subtitle: "Hardcover Subtitle",
                isbn_10: "054792822X",
                isbn_13: "9780547928227",
                pages: 432,
                release_date: "2012-08-14",
                publisher: { name: "Mariner Books" },
                language: { language: "English" },
                book: {
                  title: "Book Title",
                  description: "A book description",
                  image: { url: "https://assets.hardcover.app/cover.jpg" },
                },
              },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await lookupHardcover({ isbn: "978-0-547-92822-7" });

    expect(result).toMatchObject({
      provider: "hardcover",
      title: "Hardcover Title",
      subtitle: "Hardcover Subtitle",
      publisher: "Mariner Books",
      publishedDate: "2012-08-14",
      pageCount: 432,
      language: "English",
      description: "A book description",
      isbn10: "054792822X",
      isbn13: "9780547928227",
      coverUrl: "https://assets.hardcover.app/cover.jpg",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.hardcover.app/v1/graphql",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ authorization: "Bearer test-token" }),
      }),
    );
  });

  it("skips Hardcover lookup without a server-side token", async () => {
    process.env.HARDCOVER_API_TOKEN_FILE = "D:/definitely-missing-hardcover-token.txt";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(lookupHardcover({ isbn: "9780547928227" })).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
