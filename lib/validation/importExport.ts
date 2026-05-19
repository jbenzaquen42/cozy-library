import { z } from "zod";

export const csvImportInputSchema = z.object({
  fileName: z.string().min(1),
  csvText: z.string().min(1),
});
