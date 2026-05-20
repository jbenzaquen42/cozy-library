import { z } from "zod";

export const sceneKeySchema = z
  .string()
  .min(3)
  .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "Scene keys must be lowercase, dot-delimited identifiers");

export const listLocationsInputSchema = z
  .object({
    includeSlots: z.boolean().default(true),
  })
  .default({ includeSlots: true });

export const idInputSchema = z.object({ id: z.string().uuid() });

export const levelInputSchema = z.object({
  name: z.string().min(1),
  sceneKey: sceneKeySchema,
  sortOrder: z.number().int().min(0),
});

export const updateLevelInputSchema = levelInputSchema.extend({ id: z.string().uuid() });

export const roomInputSchema = z.object({
  levelId: z.string().uuid(),
  name: z.string().min(1),
  sceneKey: sceneKeySchema,
  sortOrder: z.number().int().min(0),
});

export const updateRoomInputSchema = roomInputSchema.extend({ id: z.string().uuid() });

export const bookshelfInputSchema = z.object({
  roomId: z.string().uuid(),
  name: z.string().min(1),
  sceneKey: sceneKeySchema,
  rowCount: z.number().int().min(1),
  depthCount: z.number().int().min(1),
  sortOrder: z.number().int().min(0),
  widthUnits: z.number().int().min(1).default(1),
  presetName: z.string().optional(),
  widthMeters: z.number().positive().optional(),
  heightMeters: z.number().positive().optional(),
  depthMeters: z.number().positive().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  positionZ: z.number().optional(),
  rotationX: z.number().optional(),
  rotationY: z.number().optional(),
  rotationZ: z.number().optional(),
  frameColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  shelfColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  trimColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  notes: z.string().optional(),
});

export const updateBookshelfInputSchema = bookshelfInputSchema.extend({ id: z.string().uuid() });

export const reorderInputSchema = z.object({
  id: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export type ListLocationsInput = z.infer<typeof listLocationsInputSchema>;
export type LevelInput = z.infer<typeof levelInputSchema>;
export type UpdateLevelInput = z.infer<typeof updateLevelInputSchema>;
export type RoomInput = z.infer<typeof roomInputSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomInputSchema>;
export type BookshelfInput = z.infer<typeof bookshelfInputSchema>;
export type UpdateBookshelfInput = z.infer<typeof updateBookshelfInputSchema>;
export type ReorderInput = z.infer<typeof reorderInputSchema>;
