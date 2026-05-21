import { backupV1Schema, type BackupV1 } from "@/lib/validation/importExport";

export type ImportPreview = {
  valid: boolean;
  schemaVersion: number | null;
  exportedAt: string | null;
  includeMetadata: boolean;
  levels: number;
  rooms: number;
  bookcases: number;
  slots: number;
  books: number;
  copies: number;
  unshelvedCopies: number;
  warnings: string[];
  errors: string[];
};

export function parseAndValidateBackup(raw: unknown): { backup: BackupV1 | null; preview: ImportPreview } {
  // 1. Try to parse as JSON
  let parsed: unknown;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {
      backup: null,
      preview: {
        valid: false,
        schemaVersion: null,
        exportedAt: null,
        includeMetadata: false,
        levels: 0,
        rooms: 0,
        bookcases: 0,
        slots: 0,
        books: 0,
        copies: 0,
        unshelvedCopies: 0,
        warnings: [],
        errors: ["File is not valid JSON."],
      },
    };
  }

  // 2. Validate against schema
  const result = backupV1Schema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    return {
      backup: null,
      preview: {
        valid: false,
        schemaVersion: typeof (parsed as Record<string, unknown>)?.schemaVersion === "number"
          ? (parsed as Record<string, unknown>).schemaVersion as number
          : null,
        exportedAt: typeof (parsed as Record<string, unknown>)?.exportedAt === "string"
          ? (parsed as Record<string, unknown>).exportedAt as string
          : null,
        includeMetadata: false,
        levels: 0,
        rooms: 0,
        bookcases: 0,
        slots: 0,
        books: 0,
        copies: 0,
        unshelvedCopies: 0,
        warnings: [],
        errors: [...errors, "Backup file does not match the expected format."],
      },
    };
  }

  const backup = result.data;

  // 3. Generate warnings
  const warnings: string[] = [];

  if (backup.schemaVersion !== 1) {
    warnings.push(`Unknown schema version: ${backup.schemaVersion}. Only version 1 is supported.`);
  }

  // Check for duplicate ISBNs
  const isbn13Set = new Set<string>();
  for (const book of backup.books) {
    if (book.isbn13) {
      if (isbn13Set.has(book.isbn13)) {
        warnings.push(`Duplicate ISBN-13: ${book.isbn13}`);
      }
      isbn13Set.add(book.isbn13);
    }
  }

  // Check for orphan room references
  const levelKeys = new Set(backup.home.levels.map((l) => l.sceneKey));
  for (const room of backup.home.rooms) {
    if (!levelKeys.has(room.levelSceneKey)) {
      warnings.push(`Room "${room.name}" references unknown level "${room.levelSceneKey}"`);
    }
  }

  // Check for orphan bookcase references
  const roomKeys = new Set(backup.home.rooms.map((r) => r.sceneKey));
  for (const bookcase of backup.home.bookcases) {
    if (!roomKeys.has(bookcase.roomSceneKey)) {
      warnings.push(`Bookcase "${bookcase.name}" references unknown room "${bookcase.roomSceneKey}"`);
    }
  }

  // Check for orphan slot references
  const bookcaseKeys = new Set(backup.home.bookcases.map((b) => b.sceneKey));
  for (const slot of backup.home.slots) {
    if (!bookcaseKeys.has(slot.bookcaseSceneKey)) {
      warnings.push(`Slot references unknown bookcase "${slot.bookcaseSceneKey}"`);
    }
  }

  // Check for copies referencing unknown bookcase scene keys
  const unshelvedCopies = backup.copies.filter((c) => !c.bookcaseSceneKey).length;
  for (const copy of backup.copies) {
    if (copy.bookcaseSceneKey && !bookcaseKeys.has(copy.bookcaseSceneKey)) {
      warnings.push(`Copy of "${copy.bookTitle}" references unknown bookcase "${copy.bookcaseSceneKey}"`);
    }
  }

  // Check for invalid colors
  const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
  for (const bookcase of backup.home.bookcases) {
    for (const [field, value] of Object.entries({
      frameColor: bookcase.frameColor,
      shelfColor: bookcase.shelfColor,
      trimColor: bookcase.trimColor,
    })) {
      if (value && !hexColorRegex.test(value)) {
        warnings.push(`Bookcase "${bookcase.name}" has invalid ${field}: ${value}`);
      }
    }
  }

  const preview: ImportPreview = {
    valid: true,
    schemaVersion: backup.schemaVersion,
    exportedAt: backup.exportedAt,
    includeMetadata: backup.options.includeMetadata,
    levels: backup.home.levels.length,
    rooms: backup.home.rooms.length,
    bookcases: backup.home.bookcases.length,
    slots: backup.home.slots.length,
    books: backup.books.length,
    copies: backup.copies.length,
    unshelvedCopies,
    warnings,
    errors: [],
  };

  return { backup, preview };
}
