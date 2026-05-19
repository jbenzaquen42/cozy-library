"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import { loanCopy, returnLoan } from "@/lib/db/loans";
import { loanInputSchema } from "@/lib/validation/book";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function fail(path: string, error: unknown): never {
  const message = error instanceof AppError || error instanceof Error ? error.message : "Loan update failed";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function loanCopyAction(formData: FormData) {
  const bookId = text(formData, "bookId");
  const returnTo = text(formData, "returnTo") || (bookId ? `/books/${bookId}` : "/loans");
  try {
    await loanCopy(
      loanInputSchema.parse({
        copyId: text(formData, "copyId"),
        borrowerName: text(formData, "borrowerName"),
        notes: text(formData, "notes"),
      }),
    );
    revalidatePath("/loans");
    if (bookId) revalidatePath(`/books/${bookId}`);
    revalidatePath("/");
  } catch (error) {
    fail(returnTo, error);
  }
  redirect(`${returnTo}?saved=1`);
}

export async function returnLoanAction(formData: FormData) {
  const bookId = text(formData, "bookId");
  const returnTo = text(formData, "returnTo") || (bookId ? `/books/${bookId}` : "/loans");
  try {
    await returnLoan(text(formData, "loanId"));
    revalidatePath("/loans");
    if (bookId) revalidatePath(`/books/${bookId}`);
    revalidatePath("/");
  } catch (error) {
    fail(returnTo, error);
  }
  redirect(`${returnTo}?saved=1`);
}
