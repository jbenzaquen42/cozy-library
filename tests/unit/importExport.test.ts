import { beforeAll, describe, expect, it } from "vitest";
import {
  backupV1Schema,
  exportedBookSchema,
  exportedCopySchema,
  exportedBookcaseSchema,
  exportedSlotSchema,
} from "../../lib/validation/importExport";
import { buildBackupV1 } from "../../lib/files/exportBuilder";
import { parseAndValidateBackup } from "../../lib/files/importParser";
import { prisma } from "../../lib/db/prisma";

const hasDatabase = Boolean(process.env.DATABASE_URL);

// ---------------------------------------------------------------------------
// Schema validation tests (no database needed)
// ---------------------------------------------------------------------------

describe("import/export schemas", () => {
  describe("backupV1Schema", () => {
    it("accepts a valid minimal backup object", () => {
      const result = backupV1Schema.safeParse({
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        app: { name: "cozy-library", version: "0.1.0" },
        options: { includeMetadata: true },
        home: { levels: [], rooms: [], bookcases: [], slots: [] },
        books: [],
        copies: [],
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required fields", () => {
      const result = backupV1Schema.safeParse({
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        // missing app, options, home, books, copies
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("app");
        expect(paths).toContain("options");
        expect(paths).toContain("home");
        expect(paths).toContain("books");
        expect(paths).toContain("copies");
      }
    });

    it("rejects wrong schemaVersion", () => {
      const result = backupV1Schema.safeParse({
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        app: { name: "cozy-library", version: "0.1.0" },
        options: { includeMetadata: true },
        home: { levels: [], rooms: [], bookcases: [], slots: [] },
        books: [],
        copies: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const versionIssue = result.error.issues.find((i) => i.path.includes("schemaVersion"));
        expect(versionIssue).toBeDefined();
      }
    });
  });

  describe("exportedBookSchema", () => {
    it("accepts a book with metadata", () => {
      const result = exportedBookSchema.safeParse({
        title: "The Great Gatsby",
        displayAuthor: "F. Scott Fitzgerald",
        isbn13: "9780743273565",
        publisher: "Scribner",
        publishedDate: "1925-04-10",
        pageCount: 180,
        language: "en",
        description: "A novel about the American dream.",
        categories: ["Fiction", "Classic"],
        spineColor: "#1a3c6e",
        metadataJson: { source: "google" },
        metadataSource: "google",
        createdAt: new Date().toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it("accepts a book without metadata (metadataJson omitted)", () => {
      const result = exportedBookSchema.safeParse({
        title: "Minimal Book",
        displayAuthor: "Unknown",
        createdAt: new Date().toISOString(),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadataJson).toBeUndefined();
        expect(result.data.categories).toEqual([]);
      }
    });
  });

  describe("exportedCopySchema", () => {
    it("accepts an unshelved copy (bookcaseSceneKey undefined)", () => {
      const result = exportedCopySchema.safeParse({
        bookTitle: "Some Book",
        copyLabel: "1",
        bookcaseSceneKey: undefined,
        rowIndex: undefined,
        depthIndex: undefined,
        status: "AVAILABLE",
        createdAt: new Date().toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it("accepts a shelved copy with position", () => {
      const result = exportedCopySchema.safeParse({
        bookTitle: "Some Book",
        copyLabel: "2",
        bookcaseSceneKey: "shelf.downstairs.entry.entry-shelf",
        rowIndex: 1,
        depthIndex: 1,
        shelfPosition: 3,
        condition: "Good",
        notes: "Nice copy",
        status: "LOANED",
        createdAt: new Date().toISOString(),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("exportedBookcaseSchema", () => {
    it("accepts all optional fields", () => {
      const result = exportedBookcaseSchema.safeParse({
        sceneKey: "shelf.test.bookcase",
        roomSceneKey: "room.test.room",
        name: "Test Bookcase",
        rowCount: 3,
        depthCount: 2,
        sortOrder: 10,
        widthUnits: 2,
        presetName: "Custom",
        widthMeters: 1.8,
        heightMeters: 2.4,
        depthMeters: 0.35,
        positionX: 1.0,
        positionY: 0.5,
        positionZ: -2.0,
        rotationX: 0,
        rotationY: Math.PI / 4,
        rotationZ: 0,
        frameColor: "#b99068",
        shelfColor: "#8a6548",
        trimColor: "#5a3a28",
        notes: "A beautiful bookcase",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("exportedSlotSchema", () => {
    it("requires bookcaseSceneKey, rowIndex, depthIndex, label", () => {
      const result = exportedSlotSchema.safeParse({
        bookcaseSceneKey: "shelf.test.bookcase",
        rowIndex: 1,
        depthIndex: 1,
        label: "R1-D1",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing bookcaseSceneKey", () => {
      const result = exportedSlotSchema.safeParse({
        rowIndex: 1,
        depthIndex: 1,
        label: "R1-D1",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing rowIndex", () => {
      const result = exportedSlotSchema.safeParse({
        bookcaseSceneKey: "shelf.test",
        depthIndex: 1,
        label: "R1-D1",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing depthIndex", () => {
      const result = exportedSlotSchema.safeParse({
        bookcaseSceneKey: "shelf.test",
        rowIndex: 1,
        label: "R1-D1",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing label", () => {
      const result = exportedSlotSchema.safeParse({
        bookcaseSceneKey: "shelf.test",
        rowIndex: 1,
        depthIndex: 1,
      });
      expect(result.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Builder tests (needs database)
// ---------------------------------------------------------------------------

describe.skipIf(!hasDatabase)("export builder", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("returns a valid backup with includeMetadata: true", async () => {
    const backup = await buildBackupV1({ includeMetadata: true });

    const result = backupV1Schema.safeParse(backup);
    expect(result.success).toBe(true);
    expect(backup.schemaVersion).toBe(1);
    expect(backup.app.name).toBe("cozy-library");
    expect(backup.options.includeMetadata).toBe(true);
  });

  it("returns books without metadataJson when includeMetadata: false", async () => {
    const backup = await buildBackupV1({ includeMetadata: false });

    expect(backup.options.includeMetadata).toBe(false);
    for (const book of backup.books) {
      expect(book.metadataJson).toBeUndefined();
    }
  });

  it("includes all seeded levels, rooms, bookcases, and slots", async () => {
    const backup = await buildBackupV1({ includeMetadata: true });

    expect(backup.home.levels.length).toBeGreaterThanOrEqual(2);
    expect(backup.home.rooms.length).toBeGreaterThanOrEqual(3);
    expect(backup.home.bookcases.length).toBeGreaterThanOrEqual(5);
    expect(backup.home.slots.length).toBeGreaterThanOrEqual(1);

    const levelKeys = backup.home.levels.map((l) => l.sceneKey);
    expect(levelKeys).toContain("level.downstairs");
    expect(levelKeys).toContain("level.upstairs");

    const roomKeys = backup.home.rooms.map((r) => r.sceneKey);
    expect(roomKeys).toContain("room.downstairs.entry");
    expect(roomKeys).toContain("room.upstairs.hallway");
    expect(roomKeys).toContain("room.upstairs.study");

    const bookcaseKeys = backup.home.bookcases.map((b) => b.sceneKey);
    expect(bookcaseKeys).toContain("shelf.downstairs.entry.entry-shelf");
    expect(bookcaseKeys).toContain("shelf.upstairs.hallway.bookcase-1");
    expect(bookcaseKeys).toContain("shelf.upstairs.study.study-shelf");
  });

  it("has deterministic ordering (levels by sortOrder, books by title)", async () => {
    const backup = await buildBackupV1({ includeMetadata: true });

    // Levels ordered by sortOrder ascending
    const sortOrders = backup.home.levels.map((l) => l.sortOrder);
    for (let i = 1; i < sortOrders.length; i++) {
      expect(sortOrders[i]).toBeGreaterThanOrEqual(sortOrders[i - 1]);
    }

    // Books ordered by title ascending
    const titles = backup.books.map((b) => b.title);
    for (let i = 1; i < titles.length; i++) {
      expect(titles[i].localeCompare(titles[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });

  it("has unshelved copies with undefined bookcaseSceneKey", async () => {
    const backup = await buildBackupV1({ includeMetadata: true });

    const unshelvedCopies = backup.copies.filter((c) => c.bookcaseSceneKey === undefined);
    for (const copy of unshelvedCopies) {
      expect(copy.rowIndex).toBeUndefined();
      expect(copy.depthIndex).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Import parser tests (no database needed)
// ---------------------------------------------------------------------------

describe("import parser", () => {
  it("rejects invalid JSON", () => {
    const { backup, preview } = parseAndValidateBackup("not json {{{");
    expect(backup).toBeNull();
    expect(preview.valid).toBe(false);
    expect(preview.errors).toContain("File is not valid JSON.");
  });

  it("rejects a valid JSON object that is not a backup", () => {
    const { backup, preview } = parseAndValidateBackup({ foo: "bar" });
    expect(backup).toBeNull();
    expect(preview.valid).toBe(false);
    expect(preview.errors.length).toBeGreaterThan(0);
  });

  it("accepts a valid backup and produces a preview", () => {
    const validBackup = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      app: { name: "cozy-library", version: "0.1.0" },
      options: { includeMetadata: true },
      home: {
        levels: [{ sceneKey: "level.test", name: "Test", sortOrder: 1 }],
        rooms: [{ sceneKey: "room.test", levelSceneKey: "level.test", name: "Test Room", sortOrder: 1 }],
        bookcases: [{ sceneKey: "shelf.test", roomSceneKey: "room.test", name: "Test Shelf", rowCount: 2, depthCount: 1, sortOrder: 1, widthUnits: 1 }],
        slots: [{ bookcaseSceneKey: "shelf.test", rowIndex: 1, depthIndex: 1, label: "Row 1 · Front" }],
      },
      books: [{ title: "Test Book", displayAuthor: "Author", categories: [], createdAt: new Date().toISOString() }],
      copies: [{ bookTitle: "Test Book", copyLabel: "1", status: "AVAILABLE", createdAt: new Date().toISOString() }],
    };

    const { backup, preview } = parseAndValidateBackup(validBackup);
    expect(backup).not.toBeNull();
    expect(preview.valid).toBe(true);
    expect(preview.levels).toBe(1);
    expect(preview.rooms).toBe(1);
    expect(preview.bookcases).toBe(1);
    expect(preview.slots).toBe(1);
    expect(preview.books).toBe(1);
    expect(preview.copies).toBe(1);
    expect(preview.unshelvedCopies).toBe(1);
  });

  it("warns about orphan room references", () => {
    const backup = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      app: { name: "cozy-library", version: "0.1.0" },
      options: { includeMetadata: false },
      home: {
        levels: [],
        rooms: [{ sceneKey: "room.orphan", levelSceneKey: "level.nonexistent", name: "Orphan", sortOrder: 1 }],
        bookcases: [],
        slots: [],
      },
      books: [],
      copies: [],
    };

    const { preview } = parseAndValidateBackup(backup);
    expect(preview.valid).toBe(true);
    expect(preview.warnings.some((w) => w.includes("unknown level"))).toBe(true);
  });

  it("warns about duplicate ISBNs", () => {
    const backup = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      app: { name: "cozy-library", version: "0.1.0" },
      options: { includeMetadata: false },
      home: { levels: [], rooms: [], bookcases: [], slots: [] },
      books: [
        { title: "Book A", displayAuthor: "Author", isbn13: "9780000000001", categories: [], createdAt: new Date().toISOString() },
        { title: "Book B", displayAuthor: "Author", isbn13: "9780000000001", categories: [], createdAt: new Date().toISOString() },
      ],
      copies: [],
    };

    const { preview } = parseAndValidateBackup(backup);
    expect(preview.warnings.some((w) => w.includes("Duplicate ISBN-13"))).toBe(true);
  });
});
