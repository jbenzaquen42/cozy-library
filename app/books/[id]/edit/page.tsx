import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { FlashBanner } from "@/components/ui/flash-banner";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { getBook } from "@/lib/db/books";
import { updateBookAction } from "../../actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function EditBookPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  await searchParams;
  const book = await getBook(id).catch(() => null);
  if (!book) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader label="Library" title={`Edit ${book.title}`} />
      <FlashBanner />
      <Card variant="cream" title="Book metadata">
        <form action={updateBookAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={book.id} />
          <Field label="Title" name="title" defaultValue={book.title} required />
          <Field label="Display author" name="displayAuthor" defaultValue={book.displayAuthor} required />
          <Field label="Subtitle" name="subtitle" defaultValue={book.subtitle ?? ""} />
          <Field label="Publisher" name="publisher" defaultValue={book.publisher ?? ""} />
          <Field label="ISBN-10" name="isbn10" defaultValue={book.isbn10 ?? ""} />
          <Field label="ISBN-13" name="isbn13" defaultValue={book.isbn13 ?? ""} />
          <Field label="Published date" name="publishedDate" defaultValue={book.publishedDate ?? ""} />
          <Field label="Page count" name="pageCount" type="number" defaultValue={book.pageCount?.toString() ?? ""} />
          <Field label="Language" name="language" defaultValue={book.language ?? ""} />
          <Field label="Series name" name="seriesName" defaultValue={book.seriesName ?? ""} />
          <Field label="Series number" name="seriesNumber" defaultValue={book.seriesNumber ?? ""} />
          <label className="md:col-span-2 text-sm font-semibold text-deep-brown">
            Description
            <textarea name="description" defaultValue={book.description ?? ""} rows={4} className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage" />
          </label>
          <div className="md:col-span-2"><SubmitButton pendingLabel="Saving…">Save book</SubmitButton></div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, name, defaultValue, required = false, type = "text" }: { label: string; name: string; defaultValue?: string; required?: boolean; type?: string }) {
  return (
    <label className="text-sm font-semibold text-deep-brown">
      {label}
      <input name={name} defaultValue={defaultValue} required={required} type={type} className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage" />
    </label>
  );
}
