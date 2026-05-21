import Link from "next/link";
import { Card } from "@/components/ui/card";
import { FlashBanner } from "@/components/ui/flash-banner";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { getLocationSummary, listLocations } from "@/lib/db/locations";
import {
  createBookshelfAction,
  createLevelAction,
  createRoomAction,
  deleteBookshelfAction,
  deleteLevelAction,
  deleteRoomAction,
  reorderBookshelfAction,
  reorderLevelAction,
  reorderRoomAction,
  updateBookshelfAction,
  updateLevelAction,
  updateRoomAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; saved?: string }>;
type LocationLevels = Awaited<ReturnType<typeof listLocations>>;
type LocationLevel = LocationLevels[number];
type LocationRoom = LocationLevel["rooms"][number];
type LocationShelf = LocationRoom["bookshelves"][number];
type RoomWithLevel = LocationRoom & { levelName: string };
type SelectOption = { value: string; label: string };

export default async function LocationsPage({ searchParams }: { searchParams: SearchParams }) {
  const [, levels, summary] = await Promise.all([
    searchParams,
    listLocations({ includeSlots: true }),
    getLocationSummary(),
  ]);
  const rooms: RoomWithLevel[] = levels.flatMap((level: LocationLevel) => level.rooms.map((room: LocationRoom) => ({ ...room, levelName: level.name })));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader label="Locations" title="Locations" />

      <Card variant="cream" className="max-w-3xl">
        <p className="text-sm text-muted-text">
          Locations define where books can live in your home. Add floors, rooms, and bookcases to organize your shelves.
          Browse and move books from the <Link href="/" className="font-semibold text-sage underline underline-offset-2 hover:text-deep-brown">home page</Link>.
        </p>
      </Card>

      <FlashBanner successMessage="Location changes saved." />

      <dl className="grid gap-3 sm:grid-cols-4">
        <Summary label="Floors / Areas" value={summary.levelCount} />
        <Summary label="Rooms" value={summary.roomCount} />
        <Summary label="Bookcases" value={summary.bookshelfCount} />
        <Summary label="Shelf spots" value={summary.slotCount} />
      </dl>

      <section className="grid gap-5 lg:grid-cols-3">
        <CreateLevelForm />
        <CreateRoomForm levels={levels} />
        <CreateBookshelfForm rooms={rooms} />
      </section>

      <div className="space-y-6">
        {levels.map((level: LocationLevel) => (
          <Card key={level.id} variant="white" className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-deep-brown">{level.name}</h2>
                <SceneKeyDetails sceneKey={level.sceneKey} />
              </div>
              <ReorderAndDelete id={level.id} reorderAction={reorderLevelAction} deleteAction={deleteLevelAction} deleteLabel="Delete floor / area" />
            </div>
            <form action={updateLevelAction} className="grid gap-3 rounded-2xl bg-parchment p-4 md:grid-cols-4">
              <input type="hidden" name="id" value={level.id} />
              <Field label="Floor / Area name" name="name" defaultValue={level.name} />
              <Field label="Scene key" name="sceneKey" defaultValue={level.sceneKey} />
              <NumberField label="Order" name="sortOrder" defaultValue={level.sortOrder} />
              <div className="flex items-end"><SubmitButton size="sm" pendingLabel="Saving…">Save floor</SubmitButton></div>
            </form>

            <div className="space-y-4">
              {level.rooms.map((room: LocationRoom) => (
                <details key={room.id} className="group rounded-2xl border border-warm-border bg-cream/70 p-4">
                  <summary className="cursor-pointer rounded-2xl bg-white/60 px-4 py-3 marker:text-sage">
                    <h3 className="inline font-heading text-xl font-semibold text-deep-brown">{room.name}</h3>
                    <span className="ml-3 text-sm text-muted-text">{room.bookshelves.length} bookcases</span>
                  </summary>
                  <div className="mt-4 flex flex-col gap-3 border-t border-warm-border pt-4 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm text-muted-text">Use these controls to edit this room, adjust order, or delete it intentionally.</p>
                    <ReorderAndDelete id={room.id} reorderAction={reorderRoomAction} deleteAction={deleteRoomAction} deleteLabel="Delete room" />
                  </div>
                  <form action={updateRoomAction} className="mt-4 grid gap-3 rounded-2xl bg-white/60 p-4 md:grid-cols-5">
                    <input type="hidden" name="id" value={room.id} />
                    <SelectField label="Floor / Area" name="levelId" defaultValue={room.levelId} options={levels.map((item: LocationLevel) => ({ value: item.id, label: item.name }))} />
                    <Field label="Room name" name="name" defaultValue={room.name} />
                    <Field label="Scene key" name="sceneKey" defaultValue={room.sceneKey} />
                    <NumberField label="Order" name="sortOrder" defaultValue={room.sortOrder} />
                    <div className="flex items-end"><SubmitButton size="sm" pendingLabel="Saving…">Save room</SubmitButton></div>
                  </form>

                  <div className="mt-4 space-y-3">
                    {room.bookshelves.map((shelf: LocationShelf) => {
                      const totalSlots = shelf.slots.length;
                      const bookCount = shelf.slots.reduce((acc, s) => acc + (s._count?.copies ?? 0), 0);
                      const openSpots = totalSlots - bookCount;

                      return (
                        <details key={shelf.id} className="group rounded-2xl border border-blue-border bg-white/70 p-4">
                          <summary className="cursor-pointer rounded-2xl bg-cream/70 px-4 py-3 marker:text-sage">
                            <span className="font-semibold text-deep-brown">{shelf.name}</span>
                            <span className="ml-3 text-sm text-muted-text">
                              {shelf.rowCount} {shelf.rowCount === 1 ? "shelf" : "shelves"} · {bookCount} {bookCount === 1 ? "book" : "books"} · {openSpots} open {openSpots === 1 ? "spot" : "spots"}
                            </span>
                          </summary>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Link
                              href={`/?shelf=${encodeURIComponent(shelf.sceneKey)}`}
                              className="inline-flex items-center gap-1 rounded-full border border-sage/30 bg-sage/10 px-3 py-1 text-xs font-semibold text-sage transition-colors hover:bg-sage/20"
                            >
                              Browse books →
                            </Link>
                          </div>
                          <div className="mt-4 flex flex-col gap-3 border-t border-blue-border pt-4 sm:flex-row sm:items-start sm:justify-between">
                            <p className="text-sm text-muted-text">Use these controls to change bookcase dimensions, move it, adjust order, or delete it intentionally.</p>
                            <ReorderAndDelete id={shelf.id} reorderAction={reorderBookshelfAction} deleteAction={deleteBookshelfAction} deleteLabel="Delete bookcase" />
                          </div>
                          <form action={updateBookshelfAction} className="mt-4 grid gap-3 rounded-2xl bg-cream/50 p-4 md:grid-cols-6">
                            <input type="hidden" name="id" value={shelf.id} />
                            <SelectField label="Room" name="roomId" defaultValue={shelf.roomId} options={rooms.map((item: RoomWithLevel) => ({ value: item.id, label: `${item.levelName} / ${item.name}` }))} />
                            <Field label="Bookcase name" name="name" defaultValue={shelf.name} />
                            <Field label="Scene key" name="sceneKey" defaultValue={shelf.sceneKey} />
                            <div className="grid gap-3 md:col-span-3 md:grid-cols-3">
                              <NumberField label="Rows" name="rowCount" defaultValue={shelf.rowCount} min={1} />
                              <NumberField label="Depth" name="depthCount" defaultValue={shelf.depthCount} min={1} />
                              <NumberField label="Width" name="widthUnits" defaultValue={shelf.widthUnits} min={1} />
                            </div>
                            <NumberField label="Order" name="sortOrder" defaultValue={shelf.sortOrder} />
                            <label className="md:col-span-4 text-sm font-semibold text-deep-brown">
                              Notes
                              <input name="notes" defaultValue={shelf.notes ?? ""} className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage" />
                            </label>
                            <div className="flex items-end"><SubmitButton size="sm" pendingLabel="Saving…">Save bookcase</SubmitButton></div>
                          </form>
                        </details>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SceneKeyDetails({ sceneKey }: { sceneKey: string }) {
  return (
    <details className="text-xs text-muted-text">
      <summary className="inline cursor-pointer hover:text-deep-brown">Show scene key</summary>
      <span className="ml-1 font-mono">{sceneKey}</span>
    </details>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="blue">
      <dt className="text-sm text-muted-text">{label}</dt>
      <dd className="mt-1 text-2xl font-bold">{value}</dd>
    </Card>
  );
}

function CreateLevelForm() {
  return (
    <Card title="Add floor / area" variant="cream">
      <form action={createLevelAction} className="mt-4 space-y-3">
        <Field label="Floor / Area name" name="name" placeholder="Basement" />
        <Field label="Scene key" name="sceneKey" placeholder="level.basement" />
        <NumberField label="Order" name="sortOrder" defaultValue={10} />
        <SubmitButton size="sm" pendingLabel="Adding…">Add floor</SubmitButton>
      </form>
    </Card>
  );
}

function CreateRoomForm({ levels }: { levels: { id: string; name: string }[] }) {
  return (
    <Card title="Add room" variant="pink">
      <form action={createRoomAction} className="mt-4 space-y-3">
        <SelectField label="Floor / Area" name="levelId" options={levels.map((level: { id: string; name: string }) => ({ value: level.id, label: level.name }))} />
        <Field label="Room name" name="name" placeholder="Living Room" />
        <Field label="Scene key" name="sceneKey" placeholder="room.downstairs.living-room" />
        <NumberField label="Order" name="sortOrder" defaultValue={10} />
        <SubmitButton size="sm" pendingLabel="Adding…">Add room</SubmitButton>
      </form>
    </Card>
  );
}

function CreateBookshelfForm({ rooms }: { rooms: { id: string; name: string; levelName: string }[] }) {
  return (
    <Card title="Add bookcase" variant="blue">
      <form action={createBookshelfAction} className="mt-4 space-y-3">
        <SelectField label="Room" name="roomId" options={rooms.map((room: { id: string; name: string; levelName: string }) => ({ value: room.id, label: `${room.levelName} / ${room.name}` }))} />
        <Field label="Bookcase name" name="name" placeholder="Living Room Bookcase" />
        <Field label="Scene key" name="sceneKey" placeholder="shelf.downstairs.living-room.main" />
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Rows" name="rowCount" defaultValue={4} min={1} />
          <NumberField label="Depth" name="depthCount" defaultValue={2} min={1} />
          <NumberField label="Order" name="sortOrder" defaultValue={10} />
        </div>
        <NumberField label="Width" name="widthUnits" defaultValue={1} min={1} />
        <input type="hidden" name="notes" value="" />
        <SubmitButton size="sm" pendingLabel="Adding…">Add bookcase</SubmitButton>
      </form>
    </Card>
  );
}

function ReorderAndDelete({
  id,
  reorderAction,
  deleteAction,
  deleteLabel,
}: {
  id: string;
  reorderAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  deleteLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <form action={reorderAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="direction" value="up" />
          <SubmitButton variant="outline" size="sm" pendingLabel="…">↑</SubmitButton>
        </form>
        <form action={reorderAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="direction" value="down" />
          <SubmitButton variant="outline" size="sm" pendingLabel="…">↓</SubmitButton>
        </form>
      </div>
      <div className="rounded-xl border border-soft-red/20 bg-soft-red/5 p-2">
        <form action={deleteAction}>
          <input type="hidden" name="id" value={id} />
          <SubmitButton
            variant="danger"
            size="sm"
            pendingLabel="Deleting…"
            confirmMessage={`${deleteLabel}? This cannot be undone.`}
          >
            {deleteLabel}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="block text-sm font-semibold text-deep-brown">
      {label}
      <input name={name} defaultValue={defaultValue} placeholder={placeholder} required className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage" />
    </label>
  );
}

function NumberField({ label, name, defaultValue, min = 0 }: { label: string; name: string; defaultValue: number; min?: number }) {
  return (
    <label className="block text-sm font-semibold text-deep-brown">
      {label}
      <input type="number" name={name} defaultValue={defaultValue} min={min} required className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage" />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: SelectOption[];
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-deep-brown">
      {label}
      <select name={name} defaultValue={defaultValue} required className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage">
        {options.map((option: SelectOption) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
