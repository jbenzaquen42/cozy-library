import { z } from "zod";

// ---------------------------------------------------------------------------
// Backup options
// ---------------------------------------------------------------------------

export const backupOptionsSchema = z.object({
  includeMetadata: z.boolean(),
});

// ---------------------------------------------------------------------------
// Home hierarchy
// ---------------------------------------------------------------------------

export const exportedLevelSchema = z.object({
  sceneKey: z.string(),
  name: z.string(),
  sortOrder: z.number(),
});

export const exportedRoomSchema = z.object({
  sceneKey: z.string(),
  levelSceneKey: z.string(),
  name: z.string(),
  sortOrder: z.number(),
});

export const exportedBookcaseSchema = z.object({
  sceneKey: z.string(),
  roomSceneKey: z.string(),
  name: z.string(),
  rowCount: z.number().int().min(1),
  depthCount: z.number().int().min(1),
  sortOrder: z.number(),
  widthUnits: z.number().int().min(1).default(1),
  presetName: z.string().optional(),
  widthMeters: z.number().optional(),
  heightMeters: z.number().optional(),
  depthMeters: z.number().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  positionZ: z.number().optional(),
  rotationX: z.number().optional(),
  rotationY: z.number().optional(),
  rotationZ: z.number().optional(),
  frameColor: z.string().optional(),
  shelfColor: z.string().optional(),
  trimColor: z.string().optional(),
  notes: z.string().optional(),
});

export const exportedSlotSchema = z.object({
  bookcaseSceneKey: z.string(),
  rowIndex: z.number().int().min(1),
  depthIndex: z.number().int().min(1),
  label: z.string(),
});

// ---------------------------------------------------------------------------
// Books & copies
// ---------------------------------------------------------------------------

export const exportedBookSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  displayAuthor: z.string(),
  isbn10: z.string().nullable().optional(),
  isbn13: z.string().nullable().optional(),
  publisher: z.string().optional(),
  publishedDate: z.string().optional(),
  pageCount: z.number().optional(),
  language: z.string().optional(),
  description: z.string().optional(),
  categories: z.array(z.string()).default([]),
  seriesName: z.string().optional(),
  seriesNumber: z.string().optional(),
  spineColor: z.string().optional(),
  coverImagePath: z.string().optional(),
  metadataJson: z.any().optional(),
  metadataSource: z.string().optional(),
  createdAt: z.string(),
});

export const exportedCopySchema = z.object({
  bookIsbn13: z.string().nullable().optional(),
  bookTitle: z.string(),
  copyLabel: z.string(),
  bookcaseSceneKey: z.string().nullable().optional(),
  rowIndex: z.number().nullable().optional(),
  depthIndex: z.number().nullable().optional(),
  shelfPosition: z.number().nullable().optional(),
  spineColor: z.string().optional(),
  condition: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["AVAILABLE", "LOANED"]),
  createdAt: z.string(),
});

// ---------------------------------------------------------------------------
// Full backup v1
// ---------------------------------------------------------------------------

export const backupV1Schema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  app: z.object({
    name: z.literal("cozy-library"),
    version: z.string(),
  }),
  options: backupOptionsSchema,
  home: z.object({
    levels: z.array(exportedLevelSchema),
    rooms: z.array(exportedRoomSchema),
    bookcases: z.array(exportedBookcaseSchema),
    slots: z.array(exportedSlotSchema),
  }),
  books: z.array(exportedBookSchema),
  copies: z.array(exportedCopySchema),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type BackupOptions = z.infer<typeof backupOptionsSchema>;
export type ExportedLevel = z.infer<typeof exportedLevelSchema>;
export type ExportedRoom = z.infer<typeof exportedRoomSchema>;
export type ExportedBookcase = z.infer<typeof exportedBookcaseSchema>;
export type ExportedSlot = z.infer<typeof exportedSlotSchema>;
export type ExportedBook = z.infer<typeof exportedBookSchema>;
export type ExportedCopy = z.infer<typeof exportedCopySchema>;
export type BackupV1 = z.infer<typeof backupV1Schema>;
