import { loanInputSchema, returnLoanInputSchema } from "../../validation/book";
import { listLoans, loanCopy, returnLoan } from "../../db/loans";
import { publicProcedure, router, toTRPCError } from "../trpc";
import { z } from "zod";

export const loanRouter = router({
  list: publicProcedure.input(z.object({ activeOnly: z.boolean().optional() }).optional()).query(async ({ input }) => listLoans(input ?? {})),
  create: publicProcedure.input(loanInputSchema).mutation(async ({ input }) => {
    try {
      return await loanCopy(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  return: publicProcedure.input(returnLoanInputSchema).mutation(async ({ input }) => {
    try {
      return await returnLoan(input.loanId);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
});
