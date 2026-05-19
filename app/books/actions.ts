"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createManualBook, updateBook } from "@/lib/db/books";
import { createCopy, deleteCopy, moveCopy, renameCopy } from "@/lib/db/copies";
import { refreshBookMetadata } from "@/lib/db/metadata";
import { AppError } from "@/lib/errors";
import {
  copyInputSchema,
  createManualBookInputSchema,
  moveCopyInputSchema,
  renameCopyInputSchema,
  updateBookInputSchema,
} from "@/lib/validation/book";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalNumberText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value === "" ? undefined : value;
}

function bookPayload(formData: FormData) {
  return {
    title: text(formData, "title"),
    subtitle: text(formData, "subtitle"),
    displayAuthor: text(formData, "displayAuthor"),
    isbn10: text(formData, "isbn10"),
    isbn13: text(formData, "isbn13"),
    publisher: text(formData, "publisher"),
    publishedDate: text(formData, "publishedDate"),
    pageCount: optionalNumberText(formData, "pageCount"),
    language: text(formData, "language"),
    description: text(formData, "description"),
    seriesName: text(formData, "seriesName"),
    seriesNumber: text(formData, "seriesNumber"),
  };
}

function fail(path: string, error: unknown): never {
  const message = error instanceof AppError || error instanceof Error ? error.message : "Book update failed";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createManualBookAction(formData: FormData) {
  let redirectTo = "/catalog";
  try {
    const book = await createManualBook(
      createManualBookInputSchema.parse({
        ...bookPayload(formData),
        locationSlotId: text(formData, "locationSlotId"),
        condition: text(formData, "condition"),
        notes: text(formData, "notes"),
      }),
    );
    await refreshBookMetadata(book.id).catch(() => null);
    revalidatePath("/catalog");
    redirectTo = `/books/${book.id}`;
  } catch (error) {
    fail("/books/new", error);
  }
  redirect(redirectTo);
}

export async function updateBookAction(formData: FormData) {
  const id = text(formData, "id");
  try {
    await updateBook(updateBookInputSchema.parse({ id, ...bookPayload(formData) }));
    revalidatePath(`/books/${id}`);
  } catch (error) {
    fail(`/books/${id}/edit`, error);
  }
  redirect(`/books/${id}?saved=1`);
}

export async function addCopyAction(formData: FormData) {
  const bookId = text(formData, "bookId");
  try {
    await createCopy(
      copyInputSchema.parse({
        bookId,
        locationSlotId: text(formData, "locationSlotId"),
        condition: text(formData, "condition"),
        notes: text(formData, "notes"),
      }),
    );
    revalidatePath(`/books/${bookId}`);
  } catch (error) {
    fail(`/books/${bookId}`, error);
  }
  redirect(`/books/${bookId}?saved=1`);
}

export async function renameCopyAction(formData: FormData) {
  const bookId = text(formData, "bookId");
  try {
    await renameCopy(renameCopyInputSchema.parse({ id: text(formData, "id"), copyLabel: text(formData, "copyLabel") }));
    revalidatePath(`/books/${bookId}`);
  } catch (error) {
    fail(`/books/${bookId}`, error);
  }
  redirect(`/books/${bookId}?saved=1`);
}

export async function moveCopyAction(formData: FormData) {
  const bookId = text(formData, "bookId");
  try {
    await moveCopy(moveCopyInputSchema.parse({ id: text(formData, "id"), locationSlotId: text(formData, "locationSlotId") }));
    revalidatePath(`/books/${bookId}`);
  } catch (error) {
    fail(`/books/${bookId}`, error);
  }
  redirect(`/books/${bookId}?saved=1`);
}

export async function deleteCopyAction(formData: FormData) {
  const bookId = text(formData, "bookId");
  try {
    await deleteCopy(text(formData, "id"));
    revalidatePath(`/books/${bookId}`);
  } catch (error) {
    fail(`/books/${bookId}`, error);
  }
  redirect(`/books/${bookId}?saved=1`);
}

export async function refreshMetadataAction(formData: FormData) {
  const bookId = text(formData, "bookId");
  try {
    await refreshBookMetadata(bookId);
    revalidatePath(`/books/${bookId}`);
    revalidatePath("/catalog");
  } catch (error) {
    fail(`/books/${bookId}`, error);
  }
  redirect(`/books/${bookId}?saved=metadata`);
}
