import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getBook } from "@/lib/db/books";
import { listLocations } from "@/lib/db/locations";
import { addCopyAction, deleteCopyAction, moveCopyAction, refreshMetadataAction, renameCopyAction } from "../actions";
import { loanCopyAction, returnLoanAction } from "@/app/loans/actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string; saved?: string }>;

export default async function BookDetailPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const [bookResult, levels] = await Promise.all([getBook(id).catch(() => null), listLocations({ includeSlots: true })]);
  if (!bookResult) notFound();
  const book = bookResult;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader label="Book detail" title={book.title}>
        <div className="flex flex-wrap gap-2">
          <form action={refreshMetadataAction}>
            <input type="hidden" name="bookId" value={book.id} />
            <Button type="submit" variant="secondary" size="sm">Refresh metadata</Button>
          </form>
          <Button href={`/books/${book.id}/edit`} variant="outline" size="sm">Edit book</Button>
        </div>
      </PageHeader>
      {error ? <div className="rounded-2xl border border-soft-red/30 bg-soft-red/10 p-4 text-sm font-semibold text-deep-brown">{error}</div> : null}
      {saved ? <div className="rounded-2xl border border-sage/30 bg-sage/10 p-4 text-sm font-semibold text-deep-brown">Saved.</div> : null}

      <Card variant="cream">
        <div className="flex flex-col gap-4 md:flex-row">
          {book.coverImagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverImagePath} alt={`Cover for ${book.title}`} className="h-48 w-32 rounded-2xl object-cover shadow-lg" />
          ) : (
            <div className="flex h-48 w-32 items-center justify-center rounded-2xl bg-baby-blue/30 text-4xl">📚</div>
          )}
          <div className="flex-1">
        <p className="text-lg font-semibold text-deep-brown">{book.displayAuthor}</p>
        {book.subtitle ? <p className="text-muted-text">{book.subtitle}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {book.isbn13 ? <Badge variant="blue">ISBN-13 {book.isbn13}</Badge> : null}
          {book.isbn10 ? <Badge variant="blue">ISBN-10 {book.isbn10}</Badge> : null}
          {book.publisher ? <Badge variant="pink">{book.publisher}</Badge> : null}
          {book.publishedDate ? <Badge>{book.publishedDate}</Badge> : null}
          {book.pageCount ? <Badge>{book.pageCount} pages</Badge> : null}
          {book.language ? <Badge>{book.language}</Badge> : null}
          {book.metadataSource ? <Badge variant="brown">Sources: {book.metadataSource}</Badge> : null}
        </div>
        {Array.isArray(book.categories) && book.categories.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {book.categories.filter((category): category is string => typeof category === "string").map((category) => <Badge key={category} variant="blue">{category}</Badge>)}
          </div>
        ) : null}
        {book.description ? <p className="mt-4 whitespace-pre-wrap text-soft-brown">{book.description}</p> : null}
        </div>
        </div>
      </Card>

      <Card variant="white" title="Copies">
        <div className="mt-4 space-y-4">
          {book.copies.map((copy) => (
            <div key={copy.id} className="rounded-2xl border border-warm-border bg-cream/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-semibold text-deep-brown">Copy {copy.copyLabel}</h3>
                  <p className="text-sm text-muted-text">{formatLocation(copy.locationSlot)}</p>
                  <p className="text-xs text-muted-text">Status: {copy.status}</p>
                  {copy.loans.length > 0 ? (
                    <div className="mt-2 text-xs text-muted-text">
                      <p className="font-semibold text-deep-brown">Loan history</p>
                      {copy.loans.map((loan) => (
                        <p key={loan.id}>
                          {loan.borrowerName}: {loan.dateLoaned.toLocaleDateString()} {loan.dateReturned ? `→ ${loan.dateReturned.toLocaleDateString()}` : "(active)"}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
                <CopyActions bookId={book.id} copy={copy} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <form action={renameCopyAction} className="flex gap-2">
                  <input type="hidden" name="bookId" value={book.id} />
                  <input type="hidden" name="id" value={copy.id} />
                  <input name="copyLabel" defaultValue={copy.copyLabel} className="w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm" />
                  <Button type="submit" size="sm">Rename</Button>
                </form>
                <form action={moveCopyAction} className="flex gap-2">
                  <input type="hidden" name="bookId" value={book.id} />
                  <input type="hidden" name="id" value={copy.id} />
                  <SlotSelect levels={levels} defaultValue={copy.locationSlotId} />
                  <Button type="submit" size="sm">Move</Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card variant="blue" title="Add another copy">
        <form action={addCopyAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <input type="hidden" name="bookId" value={book.id} />
          <SlotSelect levels={levels} />
          <input name="condition" placeholder="Condition" className="rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm" />
          <input name="notes" placeholder="Copy notes" className="rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm" />
          <div><Button type="submit" size="sm">Add copy</Button></div>
        </form>
      </Card>

      <Link className="text-sm font-semibold text-deep-brown underline" href="/catalog">Back to catalog</Link>
    </div>
  );
}

function CopyActions({ bookId, copy }: { bookId: string; copy: Awaited<ReturnType<typeof getBook>>["copies"][number] }) {
  const activeLoan = copy.loans.find((loan) => !loan.dateReturned);

  if (activeLoan) {
    return (
      <form action={returnLoanAction}>
        <input type="hidden" name="loanId" value={activeLoan.id} />
        <input type="hidden" name="bookId" value={bookId} />
        <input type="hidden" name="returnTo" value={`/books/${bookId}`} />
        <Button type="submit" size="sm">Return copy</Button>
      </form>
    );
  }

  return (
    <div className="space-y-2">
      <form action={loanCopyAction} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="copyId" value={copy.id} />
        <input type="hidden" name="bookId" value={bookId} />
        <input type="hidden" name="returnTo" value={`/books/${bookId}`} />
        <input name="borrowerName" required placeholder="Borrower name" className="rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm" />
        <input name="notes" placeholder="Notes" className="rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm" />
        <Button type="submit" size="sm">Loan</Button>
      </form>
      <form action={deleteCopyAction}>
        <input type="hidden" name="bookId" value={bookId} />
        <input type="hidden" name="id" value={copy.id} />
        <Button type="submit" variant="secondary" size="sm">Delete copy</Button>
      </form>
    </div>
  );
}

function formatLocation(slot: Awaited<ReturnType<typeof getBook>>["copies"][number]["locationSlot"]) {
  return `${slot.bookshelf.room.level.name} / ${slot.bookshelf.room.name} / ${slot.bookshelf.name} / Row ${slot.rowIndex} / ${slot.depthIndex === 1 ? "Front" : `Depth ${slot.depthIndex}`}`;
}

function SlotSelect({ levels, defaultValue }: { levels: Awaited<ReturnType<typeof listLocations>>; defaultValue?: string }) {
  const options = levels.flatMap((level) =>
    level.rooms.flatMap((room) =>
      room.bookshelves.flatMap((shelf) =>
        shelf.slots.map((slot) => ({
          id: slot.id,
          label: `${level.name} / ${room.name} / ${shelf.name} / Row ${slot.rowIndex} / ${slot.depthIndex === 1 ? "Front" : `Depth ${slot.depthIndex}`}`,
        })),
      ),
    ),
  );

  return (
    <select name="locationSlotId" defaultValue={defaultValue} required className="w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm">
      {options.map((option) => (
        <option key={option.id} value={option.id}>{option.label}</option>
      ))}
    </select>
  );
}
