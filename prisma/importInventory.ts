import { Prisma, PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import { upsertDisplayAuthor } from "../lib/db/books";
import { DEFAULT_SCENE_KEYS, generateShelfSlots } from "../lib/scene/defaultSceneKeys";

const prisma = new PrismaClient();
const DEFAULT_WORKBOOK = "import/Home_Book_Inventory_Combined_ISBN_Locations_Colors.xlsx";
const IMPORT_SOURCE = "inventory-spreadsheet";
const DEMO_SOURCE = "demo-hardcover";

type InventoryRow = {
  Title: unknown;
  Author: unknown;
  Edition: unknown;
  ISBN: unknown;
  Bookcase: unknown;
  Shelf: unknown;
  Position: unknown;
  Location: unknown;
  "Book Color Hex": unknown;
  "Photo Source": unknown;
  "Location Notes": unknown;
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

const PYTHON_XLSX_TO_JSON = String.raw`
import json, sys
from datetime import date, datetime
import openpyxl

path = sys.argv[1]
wb = openpyxl.load_workbook(path, data_only=True)
ws = wb["Final Inventory"]
headers = [str(value).strip() if value is not None else "" for value in next(ws.iter_rows(min_row=1, max_row=1, values_only=True))]
rows = []
for values in ws.iter_rows(min_row=2, values_only=True):
    row = {}
    for index, header in enumerate(headers):
        value = values[index] if index < len(values) else None
        if isinstance(value, (datetime, date)):
            value = value.isoformat()
        row[header] = value
    rows.append(row)
print(json.dumps(rows, ensure_ascii=False))
`;

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

function slugIdentity(row: { title: string; author: string; isbn: string | null }) {
  return row.isbn ? `isbn:${row.isbn}` : `title:${row.title.toLowerCase()}|${row.author.toLowerCase()}`;
}

function copyNotes(rowNumber: number, row: InventoryRow) {
  return [
    `Inventory spreadsheet row ${rowNumber}.`,
    cell(row.Location) ? `Location: ${cell(row.Location)}.` : "Location: unplaced.",
    cell(row["Photo Source"]) ? `Photo: ${cell(row["Photo Source"])}.` : "",
    cell(row["Location Notes"]) ? `Notes: ${cell(row["Location Notes"])}.` : "",
  ].filter(Boolean).join(" ");
}

function readInventoryRows(workbookPath: string) {
  const result = spawnSync("python", ["-c", PYTHON_XLSX_TO_JSON, workbookPath], { encoding: "utf8", maxBuffer: 1024 * 1024 * 20 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || "Python workbook reader failed.");
  return JSON.parse(result.stdout) as InventoryRow[];
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

async function resolveSlot(bookcase: string, shelf: number | null) {
  const sceneKey = BOOKCASE_SCENE_KEYS[bookcase.toLowerCase()];
  if (!sceneKey || !shelf) return null;
  return prisma.shelfSlot.findFirst({ where: { rowIndex: shelf, depthIndex: 1, bookshelf: { sceneKey } }, select: { id: true } });
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

async function removeBooksOutsideInventory() {
  const staleBooks = await prisma.book.findMany({
    where: { copies: { none: { notes: { startsWith: "Inventory spreadsheet row" } } } },
    select: { id: true },
  });
  const bookIds = staleBooks.map((book) => book.id);
  if (bookIds.length === 0) return 0;
  const staleCopies = await prisma.copy.findMany({ where: { bookId: { in: bookIds } }, select: { id: true } });
  const copyIds = staleCopies.map((copy) => copy.id);
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

async function findExistingBook(isbn: string | null, title: string, author: string) {
  if (isbn) {
    return prisma.book.findFirst({ where: { OR: [{ isbn10: isbn }, { isbn13: isbn }] }, select: { id: true } });
  }
  return prisma.book.findFirst({ where: { title: { equals: title, mode: "insensitive" }, displayAuthor: { equals: author, mode: "insensitive" } }, select: { id: true } });
}

async function main() {
  const workbookPath = process.argv[2] ?? DEFAULT_WORKBOOK;
  const rows = readInventoryRows(workbookPath);
  const parsedRows = rows.map((row, index) => {
    const title = cell(row.Title);
    const author = cell(row.Author) || "Unknown";
    const isbn = normalizeIsbn(row.ISBN);
    const bookcase = cell(row.Bookcase).toLowerCase();
    const shelf = numberCell(row.Shelf);
    const position = numberCell(row.Position);
    const spineColor = cleanColor(row["Book Color Hex"]);
    return { rowNumber: index + 2, row, title, author, isbn, bookcase, shelf, position, spineColor };
  }).filter((row) => row.title);

  const removedDemoBooks = await clearDemoBooksBySourceOnly();
  await normalizeDefaultShelfDimensions();
  const slotCache = new Map<string, string | null>();
  let createdBooks = 0;
  let updatedBooks = 0;
  let createdCopies = 0;
  let unplacedCopies = 0;

  const rowsByBook = new Map<string, typeof parsedRows>();
  for (const row of parsedRows) {
    const key = slugIdentity(row);
    rowsByBook.set(key, [...(rowsByBook.get(key) ?? []), row]);
  }

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
      metadataJson: {
        inventoryImport: true,
        source: IMPORT_SOURCE,
        importedAt: new Date().toISOString(),
        rowNumbers: bookRows.map((row) => row.rowNumber),
      } satisfies Prisma.InputJsonValue,
    };

    const book = existing
      ? await prisma.book.update({ where: { id: existing.id }, data: bookData, select: { id: true } })
      : await prisma.book.create({ data: { ...bookData, categories: [] }, select: { id: true } });
    if (existing) updatedBooks += 1;
    else createdBooks += 1;

    await prisma.$transaction(async (tx) => {
      await upsertDisplayAuthor(book.id, first.author, tx);
      const existingCopies = await tx.copy.findMany({ where: { bookId: book.id }, select: { id: true } });
      if (existingCopies.length > 0) {
        await tx.loan.deleteMany({ where: { copyId: { in: existingCopies.map((copy) => copy.id) } } });
        await tx.copy.deleteMany({ where: { bookId: book.id } });
      }
    });

    let copyIndex = 1;
    for (const row of bookRows) {
      const slotKey = `${row.bookcase}:${row.shelf ?? ""}`;
      if (!slotCache.has(slotKey)) {
        const slot = await resolveSlot(row.bookcase, row.shelf);
        slotCache.set(slotKey, slot?.id ?? null);
      }
      const locationSlotId = slotCache.get(slotKey) ?? null;
      if (!locationSlotId) unplacedCopies += 1;
      await prisma.copy.create({
        data: {
          bookId: book.id,
          copyLabel: String(copyIndex),
          locationSlotId,
          shelfPosition: row.position,
          spineColor: row.spineColor,
          condition: "Imported from home inventory spreadsheet",
          notes: copyNotes(row.rowNumber, row.row),
        },
      });
      copyIndex += 1;
      createdCopies += 1;
    }
  }

  const removedOutsideInventory = await removeBooksOutsideInventory();

  const totalBooks = await prisma.book.count();
  const totalCopies = await prisma.copy.count();
  console.log(JSON.stringify({ workbookPath, rows: parsedRows.length, removedDemoBooks, removedOutsideInventory, createdBooks, updatedBooks, createdCopies, unplacedCopies, totalBooks, totalCopies }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
