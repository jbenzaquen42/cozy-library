import { z } from "zod";

export const CATALOG_PAGE_SIZE = 24;

export const searchInputSchema = z.object({
  query: z.string().default(""),
  availability: z.enum(["all", "available", "loaned"]).default("all"),
  levelSceneKey: z.string().optional(),
  roomSceneKey: z.string().optional(),
  bookshelfSceneKey: z.string().optional(),
  rowIndex: z.coerce.number().int().positive().optional(),
  depthIndex: z.coerce.number().int().positive().optional(),
  author: z.string().optional(),
  category: z.string().optional(),
  view: z.enum(["grid", "list"]).default("grid"),
  page: z.coerce.number().int().positive().default(1),
});

export type SearchInput = z.infer<typeof searchInputSchema>;
