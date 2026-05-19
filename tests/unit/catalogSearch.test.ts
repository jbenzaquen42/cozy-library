import { describe, expect, it } from "vitest";
import { matchesCatalogFilters, rankCatalogBook } from "../../lib/search/catalog";

const book = {
  title: "The Hobbit",
  displayAuthor: "J. R. R. Tolkien",
  isbn10: "0345339681",
  isbn13: "9780345339683",
  categories: ["Fantasy", "Adventure"],
  copies: [
    {
      status: "AVAILABLE",
      notes: "Illustrated edition",
      locationSlot: {
        rowIndex: 2,
        depthIndex: 1,
        bookshelf: {
          name: "Entry Shelf",
          sceneKey: "shelf.downstairs.entry.entry-shelf",
          room: {
            name: "Entry / Front Door",
            sceneKey: "room.downstairs.entry",
            level: { name: "Downstairs", sceneKey: "level.downstairs" },
          },
        },
      },
    },
  ],
};

describe("catalog search ranking", () => {
  it("prioritizes ISBN over title and author matches", () => {
    expect(rankCatalogBook(book, "9780345339683")).toBe(1);
    expect(rankCatalogBook(book, "the hobbit")).toBe(2);
    expect(rankCatalogBook(book, "the")).toBe(3);
    expect(rankCatalogBook(book, "hobbit")).toBe(4);
    expect(rankCatalogBook(book, "tolkien")).toBe(5);
  });

  it("ranks category, location, and notes after author", () => {
    expect(rankCatalogBook(book, "fantasy")).toBe(6);
    expect(rankCatalogBook(book, "entry shelf")).toBe(7);
    expect(rankCatalogBook(book, "illustrated")).toBe(8);
  });

  it("matches availability and exact location filters", () => {
    expect(matchesCatalogFilters(book, { query: "", availability: "available", view: "grid" })).toBe(true);
    expect(matchesCatalogFilters(book, { query: "", availability: "loaned", view: "grid" })).toBe(false);
    expect(
      matchesCatalogFilters(book, {
        query: "",
        availability: "all",
        levelSceneKey: "level.downstairs",
        roomSceneKey: "room.downstairs.entry",
        bookshelfSceneKey: "shelf.downstairs.entry.entry-shelf",
        rowIndex: 2,
        depthIndex: 1,
        view: "grid",
      }),
    ).toBe(true);
  });
});
