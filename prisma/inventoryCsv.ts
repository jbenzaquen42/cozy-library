import { Prisma, PrismaClient } from "@prisma/client";
import { dirname } from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { upsertDisplayAuthor } from "../lib/db/books";
import { DEFAULT_SCENE_KEYS, generateShelfSlots } from "../lib/scene/defaultSceneKeys";

const prisma = new PrismaClient();

const CSV_HEADERS = ["Title", "Author", "ISBN", "Bookcase", "Shelf", "Position", "Location", "Book Color Hex", "Copy Label", "Notes"] as const;
const IMPORT_SOURCE = "inventory-csv";
const DEMO_SOURCE = "demo-hardcover";

type CsvHeader = (typeof CSV_HEADERS)[number];
type CsvRow = Record<CsvHeader, string>;
type ParsedRow = {
  rowNumber: number;
  row: CsvRow;
  title: string;
  author: string;
  isbn: string | null;
  bookcase: string;
  shelf: number | null;
  position: number | null;
  location: string;
  spineColor: string | null;
  copyLabel: string;
  notes: string;
};

const BOOKCASE_SCENE_KEYS: Record<string, string> = {
  hedgehog: DEFAULT_SCENE_KEYS.shelves.downstairsEntryShelf,
  rabbit: DEFAULT_SCENE_KEYS.shelves.upstairsHallwayBookcase1,
  wren: DEFAULT_SCENE_KEYS.shelves.upstairsHallwayBookcase2,
  fox: DEFAULT_SCENE_KEYS.shelves.upstairsHallwayBookcase3,
  fawn: DEFAULT_SCENE_KEYS.shelves.upstairsStudyShelf,
};

const BOOKCASE_DIMENSIONS: Record<string, { rowCount: number; depthCount: number }> = {
  hedgehog: { rowCount: 5, depthCount: 2 },
  rabbit: { rowCount: 3, depthCount: 2 },
  wren: { rowCount: 3, depthCount: 2 },
  fox: { rowCount: 3, depthCount: 2 },
  fawn: { rowCount: 5, depthCount: 2 },
};

function cell(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function numberCell(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  const parsed = Number.parseInt(cell(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeIsbn(value: unknown) {
  const normalized = cell(value).replace(/[-\s]/g, "");
  return normalized || null;
}

function cleanColor(value: unknown) {
  const color = cell(value).toUpperCase();
  return /^#[0-9A-F]{6}$/.test(color) ? color : null;
}

function normalizeBookcase(value: string) {
  const normalized = value.toLowerCase().replace(/\s+shelf$/, "").trim();
  if (BOOKCASE_SCENE_KEYS[normalized]) return normalized;
  const match = Object.keys(BOOKCASE_SCENE_KEYS).find((key) => normalized.includes(key));
  return match ?? normalized;
}

function slugIdentity(row: { title: string; author: string; isbn: string | null }) {
  return row.isbn ? `isbn:${row.isbn}` : `title:${row.title.toLowerCase()}|${row.author.toLowerCase()}`;
}

function csvEscape(value: unknown) {
  const text = cell(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      if (row.some((item) => item.trim())) rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((item) => item.trim())) rows.push(row);
  if (inQuotes) throw new Error("CSV parse failed: unterminated quoted value.");
  return rows;
}

function readCsvRows(filePath: string): CsvRow[] {
  const records = parseCsv(readFileSync(filePath, "utf8"));
  const headers = records.shift()?.map((header) => header.trim()) ?? [];
  const missing = CSV_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`CSV is missing required headers: ${missing.join(", ")}`);

  return records.map((record) => {
    const row = Object.fromEntries(CSV_HEADERS.map((header) => [header, record[headers.indexOf(header)]?.trim() ?? ""])) as CsvRow;
    return row;
  });
}

async function clearDemoBooksBySourceOnly() {
  const demoBooks = await prisma.book.findMany({ where: { metadataSource: DEMO_SOURCE }, select: { id: true } });
  const bookIds = demoBooks.map((book) => book.id);
  if (bookIds.length === 0) return 0;
  const demoCopies = await prisma.copy.findMany({ where: { bookId: { in: bookIds } }, select: { id: true } });
  const copyIds = demoCopies.map((copy) => copy.id);

  await prisma.$transaction([
    prisma.loan.deleteMany({ where: { copyId: { in: copyIds } } }),
    prisma.copy.deleteMany({ where: { id: { in: copyIds } } }),
    prisma.bookAuthor.deleteMany({ where: { bookId: { in: bookIds } } }),
    prisma.uploadedImage.deleteMany({ where: { bookId: { in: bookIds } } }),
    prisma.book.deleteMany({ where: { id: { in: bookIds } } }),
  ]);
  await prisma.author.deleteMany({ where: { books: { none: {} } } });
  return bookIds.length;
}

async function normalizeDefaultShelfDimensions() {
  for (const [bookcase, sceneKey] of Object.entries(BOOKCASE_SCENE_KEYS)) {
    const dimensions = BOOKCASE_DIMENSIONS[bookcase]!;
    const shelf = await prisma.bookshelf.findUnique({ where: { sceneKey }, select: { id: true } });
    if (!shelf) throw new Error(`Missing default bookshelf for ${bookcase}: ${sceneKey}`);

    const removableSlots = await prisma.shelfSlot.findMany({
      where: { bookshelfId: shelf.id, OR: [{ rowIndex: { gt: dimensions.rowCount } }, { depthIndex: { gt: dimensions.depthCount } }], copies: { none: {} } },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      if (removableSlots.length) await tx.shelfSlot.deleteMany({ where: { id: { in: removableSlots.map((slot) => slot.id) } } });
      await tx.bookshelf.update({ where: { id: shelf.id }, data: dimensions });
      for (const slot of generateShelfSlots(dimensions.rowCount, dimensions.depthCount)) {
        await tx.shelfSlot.upsert({
          where: { bookshelfId_rowIndex_depthIndex: { bookshelfId: shelf.id, rowIndex: slot.rowIndex, depthIndex: slot.depthIndex } },
          create: { bookshelfId: shelf.id, rowIndex: slot.rowIndex, depthIndex: slot.depthIndex, label: slot.label },
          update: { label: slot.label },
        });
      }
    });
  }
}

async function resolveSlot(bookcase: string, shelf: number | null) {
  const sceneKey = BOOKCASE_SCENE_KEYS[normalizeBookcase(bookcase)];
  if (!sceneKey || !shelf) return null;
  return prisma.shelfSlot.findFirst({ where: { rowIndex: shelf, depthIndex: 1, bookshelf: { sceneKey } }, select: { id: true } });
}

async function findExistingBook(isbn: string | null, title: string, author: string) {
  if (isbn) return prisma.book.findFirst({ where: { OR: [{ isbn10: isbn }, { isbn13: isbn }] }, select: { id: true } });
  return prisma.book.findFirst({ where: { title: { equals: title, mode: "insensitive" }, displayAuthor: { equals: author, mode: "insensitive" } }, select: { id: true } });
}

async function importCsv(filePath: string) {
  const rows = readCsvRows(filePath);
  const parsedRows: ParsedRow[] = rows.map((row, index) => {
    const title = cell(row.Title);
    const author = cell(row.Author) || "Unknown";
    const isbn = normalizeIsbn(row.ISBN);
    const bookcase = normalizeBookcase(cell(row.Bookcase));
    const shelf = numberCell(row.Shelf);
    const position = numberCell(row.Position);
    const location = cell(row.Location);
    const spineColor = cleanColor(row["Book Color Hex"]);
    const copyLabel = cell(row["Copy Label"]);
    const notes = cell(row.Notes);
    return { rowNumber: index + 2, row, title, author, isbn, bookcase, shelf, position, location, spineColor, copyLabel, notes };
  }).filter((row) => row.title);

  const removedDemoBooks = await clearDemoBooksBySourceOnly();
  await normalizeDefaultShelfDimensions();

  const slotCache = new Map<string, string | null>();
  const warnings: string[] = [];
  let createdBooks = 0;
  let updatedBooks = 0;
  let createdCopies = 0;
  let updatedCopies = 0;
  let unplacedCopies = 0;

  const rowsByBook = new Map<string, ParsedRow[]>();
  for (const row of parsedRows) rowsByBook.set(slugIdentity(row), [...(rowsByBook.get(slugIdentity(row)) ?? []), row]);

  for (const bookRows of rowsByBook.values()) {
    const first = bookRows[0]!;
    const existing = await findExistingBook(first.isbn, first.title, first.author);
    const bookData = {
      title: first.title,
      displayAuthor: first.author,
      isbn10: first.isbn?.length === 10 ? first.isbn : null,
      isbn13: first.isbn?.length === 13 ? first.isbn : null,
      spineColor: first.spineColor,
      metadataSource: IMPORT_SOURCE,
      metadataJson: { inventoryImport: true, source: IMPORT_SOURCE, importedAt: new Date().toISOString(), rowNumbers: bookRows.map((row) => row.rowNumber) } satisfies Prisma.InputJsonValue,
    };

    const book = existing
      ? await prisma.book.update({ where: { id: existing.id }, data: bookData, select: { id: true } })
      : await prisma.book.create({ data: { ...bookData, categories: [] }, select: { id: true } });
    if (existing) updatedBooks += 1;
    else createdBooks += 1;
    await prisma.$transaction((tx) => upsertDisplayAuthor(book.id, first.author, tx));

    let copyIndex = 1;
    for (const row of bookRows) {
      const copyLabel = row.copyLabel || String(copyIndex);
      const slotKey = `${row.bookcase}:${row.shelf ?? ""}`;
      if (!slotCache.has(slotKey)) slotCache.set(slotKey, (await resolveSlot(row.bookcase, row.shelf))?.id ?? null);
      const locationSlotId = slotCache.get(slotKey) ?? null;
      if (!locationSlotId) {
        unplacedCopies += 1;
        if (row.bookcase || row.shelf) warnings.push(`Row ${row.rowNumber}: no shelf slot found for Bookcase=${row.bookcase || "blank"}, Shelf=${row.shelf ?? "blank"}; copy left waiting for a shelf spot.`);
      }

      const copyData = {
        locationSlotId,
        shelfPosition: row.position,
        spineColor: row.spineColor,
        condition: "Imported from inventory CSV",
        notes: [row.notes, `Inventory CSV row ${row.rowNumber}.`, row.location ? `Location: ${row.location}.` : ""].filter(Boolean).join(" "),
      };
      const existingCopy = await prisma.copy.findUnique({ where: { bookId_copyLabel: { bookId: book.id, copyLabel } }, select: { id: true } });
      if (existingCopy) {
        await prisma.copy.update({ where: { id: existingCopy.id }, data: copyData });
        updatedCopies += 1;
      } else {
        await prisma.copy.create({ data: { bookId: book.id, copyLabel, ...copyData } });
        createdCopies += 1;
      }
      copyIndex += 1;
    }
  }

  const totalBooks = await prisma.book.count();
  const totalCopies = await prisma.copy.count();
  console.log(JSON.stringify({ filePath, rows: parsedRows.length, removedDemoBooks, createdBooks, updatedBooks, createdCopies, updatedCopies, unplacedCopies, totalBooks, totalCopies, warnings }, null, 2));
}

function bookcaseName(name: string) {
  return normalizeBookcase(name).replace(/^./, (char) => char.toUpperCase());
}

async function exportCsv(filePath: string) {
  const copies = await prisma.copy.findMany({
    orderBy: [{ locationSlot: { bookshelf: { sortOrder: "asc" } } }, { locationSlot: { rowIndex: "asc" } }, { shelfPosition: "asc" }, { book: { title: "asc" } }, { copyLabel: "asc" }],
    include: { book: true, locationSlot: { include: { bookshelf: { include: { room: { include: { level: true } } } } } } },
  });
  const lines = [CSV_HEADERS.join(",")];
  for (const copy of copies) {
    const slot = copy.locationSlot;
    const row: CsvRow = {
      Title: copy.book.title,
      Author: copy.book.displayAuthor,
      ISBN: copy.book.isbn13 ?? copy.book.isbn10 ?? "",
      Bookcase: slot ? bookcaseName(slot.bookshelf.name) : "",
      Shelf: slot ? String(slot.rowIndex) : "",
      Position: copy.shelfPosition ? String(copy.shelfPosition) : "",
      Location: slot ? `${slot.bookshelf.room.level.name} / ${slot.bookshelf.room.name} / ${slot.bookshelf.name}` : "",
      "Book Color Hex": copy.spineColor ?? copy.book.spineColor ?? "",
      "Copy Label": copy.copyLabel,
      Notes: copy.notes ?? "",
    };
    lines.push(CSV_HEADERS.map((header) => csvEscape(row[header])).join(","));
  }
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ filePath, rows: copies.length }, null, 2));
}

async function main() {
  const command = process.argv[2];
  const filePath = process.argv[3];
  if (!command || !filePath || !["import", "export"].includes(command)) {
    throw new Error("Usage: tsx prisma/inventoryCsv.ts <import|export> <path/to/books.csv>");
  }
  if (command === "import") await importCsv(filePath);
  else await exportCsv(filePath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
