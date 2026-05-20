import { z } from "zod";

const optionalText = z.string().trim().optional().transform((value) => value || undefined);
const optionalIsbn = z.string().trim().optional().transform((value) => {
  if (!value) return undefined;
  const normalized = value.replace(/[-\s]/g, "");
  return normalized || undefined;
});

export const bookInputSchema = z.object({
  title: z.string().trim().min(1),
  subtitle: optionalText,
  displayAuthor: z.string().trim().min(1),
  isbn10: optionalIsbn,
  isbn13: optionalIsbn,
  publisher: optionalText,
  publishedDate: optionalText,
  pageCount: z.coerce.number({ message: "Page count must be a number" }).int({ message: "Page count must be a whole number" }).positive({ message: "Page count must be positive" }).optional().or(z.literal("").transform(() => undefined)),
  language: optionalText,
  description: optionalText,
  seriesName: optionalText,
  seriesNumber: optionalText,
});

export const createManualBookInputSchema = bookInputSchema.extend({
  locationSlotId: z.string().uuid().optional(),
  condition: optionalText,
  notes: optionalText,
});

export const updateBookInputSchema = bookInputSchema.extend({ id: z.string().uuid() });

export const copyInputSchema = z.object({
  bookId: z.string().uuid(),
  locationSlotId: z.string().uuid().optional(),
  condition: optionalText,
  notes: optionalText,
});

export const renameCopyInputSchema = z.object({
  id: z.string().uuid(),
  copyLabel: z.string().trim().min(1),
});

export const moveCopyInputSchema = z.object({
  id: z.string().uuid(),
  locationSlotId: z.string().uuid().optional(),
});

export const deleteCopyInputSchema = z.object({
  id: z.string().uuid(),
});

export const loanInputSchema = z.object({
  copyId: z.string().uuid(),
  borrowerName: z.string().trim().min(1),
  dateLoaned: z.coerce.date().optional(),
  notes: optionalText,
});

export const returnLoanInputSchema = z.object({
  loanId: z.string().uuid(),
});

export type BookInput = z.infer<typeof bookInputSchema>;
export type CreateManualBookInput = z.infer<typeof createManualBookInputSchema>;
export type UpdateBookInput = z.infer<typeof updateBookInputSchema>;
export type CopyInput = z.infer<typeof copyInputSchema>;
export type RenameCopyInput = z.infer<typeof renameCopyInputSchema>;
export type MoveCopyInput = z.infer<typeof moveCopyInputSchema>;
export type LoanInput = z.infer<typeof loanInputSchema>;
export type ReturnLoanInput = z.infer<typeof returnLoanInputSchema>;
