"use server";

import { revalidatePath } from "next/cache";
import { refreshBookMetadata } from "@/lib/db/metadata";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function refreshAllMetadataAction() {
  try {
    const books = await prisma.book.findMany({
      orderBy: [{ title: "asc" }],
      select: { id: true, title: true, displayAuthor: true, isbn10: true, isbn13: true },
    });

    let refreshed = 0;
    let failed = 0;
    const failures: { title: string; author: string; isbn: string | null; error: string }[] = [];

    for (const book of books) {
      try {
        await refreshBookMetadata(book.id, prisma);
        refreshed += 1;
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : "Unknown error";
        failures.push({ title: book.title, author: book.displayAuthor, isbn: book.isbn13 ?? book.isbn10, error: message });

        const existing = await prisma.book.findUnique({
          where: { id: book.id },
          select: { metadataJson: true, metadataSource: true },
        });

        await prisma.book.update({
          where: { id: book.id },
          data: {
            metadataSource: existing?.metadataSource ?? "metadata-scan-failed",
            metadataJson: {
              ...((existing?.metadataJson && typeof existing.metadataJson === "object" && !Array.isArray(existing.metadataJson))
                ? existing.metadataJson
                : {}),
              metadataScan: { completedAt: new Date().toISOString(), status: "failed", error: message },
            },
          },
        });
      }
      await sleep(150);
    }

    revalidatePath("/catalog");
    revalidatePath("/");
    revalidatePath("/house/3d");

    return {
      ok: true,
      scanned: books.length,
      refreshed,
      failed,
      failures: failures.slice(0, 10),
    };
  } catch (error) {
    const message = error instanceof AppError || error instanceof Error ? error.message : "Metadata refresh failed";
    return { ok: false, message };
  }
}
