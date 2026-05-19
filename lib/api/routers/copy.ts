import { copyInputSchema, deleteCopyInputSchema, moveCopyInputSchema, renameCopyInputSchema } from "../../validation/book";
import { createCopy, deleteCopy, listCopies, moveCopy, renameCopy } from "../../db/copies";
import { publicProcedure, router, toTRPCError } from "../trpc";
import { z } from "zod";

export const copyRouter = router({
  list: publicProcedure.input(z.object({ bookId: z.string().uuid().optional() }).optional()).query(async ({ input }) => listCopies(input?.bookId)),
  create: publicProcedure.input(copyInputSchema).mutation(async ({ input }) => {
    try {
      return await createCopy(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  rename: publicProcedure.input(renameCopyInputSchema).mutation(async ({ input }) => {
    try {
      return await renameCopy(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  move: publicProcedure.input(moveCopyInputSchema).mutation(async ({ input }) => {
    try {
      return await moveCopy(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  delete: publicProcedure.input(deleteCopyInputSchema).mutation(async ({ input }) => {
    try {
      return await deleteCopy(input.id);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
});
