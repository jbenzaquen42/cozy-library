import { z } from "zod";

export const metadataLookupInputSchema = z.object({
  isbn: z.string().optional(),
  title: z.string().optional(),
  author: z.string().optional(),
});
