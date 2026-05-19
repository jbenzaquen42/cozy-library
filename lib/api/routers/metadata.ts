import { metadataLookupInputSchema } from "../../validation/metadata";
import { lookupMetadata, refreshBookMetadata } from "../../db/metadata";
import { publicProcedure, router, toTRPCError } from "../trpc";
import { z } from "zod";

export const metadataRouter = router({
  lookup: publicProcedure.input(metadataLookupInputSchema).query(async ({ input }) => {
    try {
      return await lookupMetadata(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  refreshBook: publicProcedure.input(z.object({ bookId: z.string().uuid() })).mutation(async ({ input }) => {
    try {
      return await refreshBookMetadata(input.bookId);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
});
