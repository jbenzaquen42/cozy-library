import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listUnshelvedCopies } from "@/lib/db/copies";

export const dynamic = "force-dynamic";

export default async function UnshelvedPage() {
  const copies = await listUnshelvedCopies();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader label="Library" title="Books waiting for a home" />
      <Card variant="cream" title={`${copies.length} copies waiting for a shelf spot`}>
        <p className="text-muted-text">Newly scanned or displaced books rest here until you settle them onto a shelf.</p>
        <div className="mt-5 grid gap-3">
          {copies.length ? copies.map((copy) => (
            <div key={copy.id} className="rounded-2xl border border-warm-border bg-white/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/books/${copy.book.id}`} className="font-semibold text-deep-brown hover:underline">{copy.book.title}</Link>
                  <p className="text-sm text-muted-text">{copy.book.displayAuthor} · copy {copy.copyLabel}</p>
                  {copy.book.isbn13 || copy.book.isbn10 ? <p className="mt-1 text-xs text-muted-text">ISBN {copy.book.isbn13 ?? copy.book.isbn10}</p> : null}
                </div>
                <Link href={`/books/${copy.book.id}`} className="rounded-full border-2 border-warm-border px-4 py-2 text-sm font-semibold text-deep-brown hover:bg-cream">Choose a shelf spot</Link>
              </div>
            </div>
          )) : <EmptyState title="Every book has a shelf spot" message="Scan or add a book whenever another one joins the library." action={{ label: "Add book manually", href: "/books/new" }} />}
        </div>
      </Card>
    </div>
  );
}
