import { Card } from "@/components/ui/card";
import { FlashBanner } from "@/components/ui/flash-banner";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { listLocations } from "@/lib/db/locations";
import { createManualBookAction } from "../actions";

export const dynamic = "force-dynamic";

type NewBookSearchParams = Promise<Record<string, string | undefined>>;
type LocationLevels = Awaited<ReturnType<typeof listLocations>>;
type LocationLevel = LocationLevels[number];
type LocationRoom = LocationLevel["rooms"][number];
type LocationShelf = LocationRoom["bookshelves"][number];
type LocationSlot = LocationShelf["slots"][number];

export default async function NewBookPage({ searchParams }: { searchParams: NewBookSearchParams }) {
  const [params, levels] = await Promise.all([searchParams, listLocations({ includeSlots: true })]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader label="Library" title="Add book manually" />
      <FlashBanner />
      <Card variant="cream" title="Book details and first copy">
        <form action={createManualBookAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Title" name="title" defaultValue={params.title} required />
          <Field label="Display author" name="displayAuthor" defaultValue={params.displayAuthor} required />
          <Field label="Subtitle" name="subtitle" defaultValue={params.subtitle} />
          <Field label="Publisher" name="publisher" defaultValue={params.publisher} />
          <Field label="ISBN-10" name="isbn10" defaultValue={params.isbn10} />
          <Field label="ISBN-13" name="isbn13" defaultValue={params.isbn13} />
          <Field label="Published date" name="publishedDate" defaultValue={params.publishedDate} placeholder="1999 or 1999-10-01" />
          <Field label="Page count" name="pageCount" defaultValue={params.pageCount} type="number" />
          <Field label="Language" name="language" defaultValue={params.language} placeholder="en" />
          <Field label="Series name" name="seriesName" />
          <Field label="Series number" name="seriesNumber" />
          <SelectSlot levels={levels} />
          <Field label="Condition" name="condition" />
          <Field label="Copy notes" name="notes" />
          <label className="md:col-span-2 text-sm font-semibold text-deep-brown">
            Description
            <textarea name="description" defaultValue={params.description} rows={4} className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage" />
          </label>
          <div className="md:col-span-2">
            <SubmitButton pendingLabel="Saving…">Save book and copy 1</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, name, required = false, type = "text", placeholder, defaultValue }: { label: string; name: string; required?: boolean; type?: string; placeholder?: string; defaultValue?: string }) {
  return (
    <label className="text-sm font-semibold text-deep-brown">
      {label}
      <input name={name} required={required} type={type} placeholder={placeholder} defaultValue={defaultValue} className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage" />
    </label>
  );
}

function SelectSlot({ levels }: { levels: LocationLevels }) {
  return (
    <label className="text-sm font-semibold text-deep-brown">
      Exact shelf slot
      <select name="locationSlotId" className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage">
        <option value="">Unshelved queue</option>
        {levels.flatMap((level: LocationLevel) =>
          level.rooms.flatMap((room: LocationRoom) =>
            room.bookshelves.flatMap((shelf: LocationShelf) =>
              shelf.slots.map((slot: LocationSlot) => (
                <option key={slot.id} value={slot.id}>
                  {level.name} / {room.name} / {shelf.name} / Row {slot.rowIndex} / {slot.depthIndex === 1 ? "Front" : `Depth ${slot.depthIndex}`}
                </option>
              )),
            ),
          ),
        )}
      </select>
    </label>
  );
}
