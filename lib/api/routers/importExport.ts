import { csvImportInputSchema } from "../../validation/importExport";
import { previewCsvImport } from "../../files/importExport";
import { publicProcedure, router, toTRPCError } from "../trpc";

export const importExportRouter = router({
  previewImport: publicProcedure.input(csvImportInputSchema).mutation(async () => {
    try {
      return await previewCsvImport();
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
});
