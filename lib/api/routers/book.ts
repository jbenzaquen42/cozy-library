import { createManualBookInputSchema, updateBookInputSchema } from "../../validation/book";
import { createManualBook, getBook, listBooks, updateBook } from "../../db/books";
import { publicProcedure, router, toTRPCError } from "../trpc";
import { z } from "zod";

export const bookRouter = router({
  list: publicProcedure.query(async () => listBooks()),
  byId: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    try {
      return await getBook(input.id);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  create: publicProcedure.input(createManualBookInputSchema).mutation(async ({ input }) => {
    try {
      return await createManualBook(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  update: publicProcedure.input(updateBookInputSchema).mutation(async ({ input }) => {
    try {
      return await updateBook(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
});
