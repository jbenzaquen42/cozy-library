import { PrismaClient } from "@prisma/client";
import { refreshBookMetadata } from "../lib/db/metadata";

const prisma = new PrismaClient();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const books = await prisma.book.findMany({ orderBy: [{ title: "asc" }], select: { id: true, title: true, displayAuthor: true, isbn10: true, isbn13: true } });
  let refreshed = 0;
  let failed = 0;
  const failures: { title: string; author: string; isbn: string | null; error: string }[] = [];

  for (const [index, book] of books.entries()) {
    try {
      await refreshBookMetadata(book.id, prisma);
      refreshed += 1;
      console.log(`[${index + 1}/${books.length}] refreshed ${book.title}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Unknown error";
      failures.push({ title: book.title, author: book.displayAuthor, isbn: book.isbn13 ?? book.isbn10, error: message });
      const existing = await prisma.book.findUnique({ where: { id: book.id }, select: { metadataJson: true, metadataSource: true } });
      await prisma.book.update({
        where: { id: book.id },
        data: {
          metadataSource: existing?.metadataSource ?? "metadata-scan-failed",
          metadataJson: {
            ...((existing?.metadataJson && typeof existing.metadataJson === "object" && !Array.isArray(existing.metadataJson)) ? existing.metadataJson : {}),
            metadataScan: { completedAt: new Date().toISOString(), status: "failed", error: message },
          },
        },
      });
      console.warn(`[${index + 1}/${books.length}] failed ${book.title}: ${message}`);
    }
    await sleep(150);
  }

  console.log(JSON.stringify({ scanned: books.length, refreshed, failed, failures }, null, 2));
}

main().finally(async () => {
  await prisma.$disconnect();
});
