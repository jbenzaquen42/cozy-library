import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { PageHeader } from "@/components/ui/page-header";
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

export default async function LocationsPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ error, saved }, levels, summary] = await Promise.all([
    searchParams,
    listLocations({ includeSlots: true }),
    getLocationSummary(),
  ]);
  const rooms = levels.flatMap((level) => level.rooms.map((room) => ({ ...room, levelName: level.name })));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader label="Locations" title="Location admin" />
      <p className="max-w-3xl text-muted-text">
        Edit levels, rooms, bookshelves, shelf row/depth counts, and display order. Shrinking or deleting occupied shelf slots is blocked so book locations are not lost.
      </p>

      {error ? <ErrorMessage error={new Error(error)} /> : null}
      {saved ? <div className="rounded-2xl border border-sage/30 bg-sage/10 p-4 text-sm font-semibold text-deep-brown">Location changes saved.</div> : null}

      <dl className="grid gap-3 sm:grid-cols-4">
        <Summary label="Levels" value={summary.levelCount} />
        <Summary label="Rooms" value={summary.roomCount} />
        <Summary label="Bookshelves" value={summary.bookshelfCount} />
        <Summary label="Shelf slots" value={summary.slotCount} />
      </dl>

      <section className="grid gap-5 lg:grid-cols-3">
        <CreateLevelForm />
        <CreateRoomForm levels={levels} />
        <CreateBookshelfForm rooms={rooms} />
      </section>

      <div className="space-y-6">
        {levels.map((level) => (
          <Card key={level.id} variant="white" className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-deep-brown">{level.name}</h2>
                <p className="text-sm text-muted-text">{level.sceneKey}</p>
              </div>
              <ReorderAndDelete id={level.id} reorderAction={reorderLevelAction} deleteAction={deleteLevelAction} deleteLabel="Delete level" />
            </div>
            <form action={updateLevelAction} className="grid gap-3 rounded-2xl bg-parchment p-4 md:grid-cols-4">
              <input type="hidden" name="id" value={level.id} />
              <Field label="Level name" name="name" defaultValue={level.name} />
              <Field label="Scene key" name="sceneKey" defaultValue={level.sceneKey} />
              <NumberField label="Order" name="sortOrder" defaultValue={level.sortOrder} />
              <div className="flex items-end"><Button type="submit" size="sm">Save level</Button></div>
            </form>

            <div className="space-y-4">
              {level.rooms.map((room) => (
                <div key={room.id} className="rounded-2xl border border-warm-border bg-cream/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-heading text-xl font-semibold text-deep-brown">{room.name}</h3>
                      <p className="text-sm text-muted-text">{room.sceneKey}</p>
                    </div>
                    <ReorderAndDelete id={room.id} reorderAction={reorderRoomAction} deleteAction={deleteRoomAction} deleteLabel="Delete room" />
                  </div>
                  <form action={updateRoomAction} className="mt-4 grid gap-3 rounded-2xl bg-white/60 p-4 md:grid-cols-5">
                    <input type="hidden" name="id" value={room.id} />
                    <SelectField label="Level" name="levelId" defaultValue={room.levelId} options={levels.map((item) => ({ value: item.id, label: item.name }))} />
                    <Field label="Room name" name="name" defaultValue={room.name} />
                    <Field label="Scene key" name="sceneKey" defaultValue={room.sceneKey} />
                    <NumberField label="Order" name="sortOrder" defaultValue={room.sortOrder} />
                    <div className="flex items-end"><Button type="submit" size="sm">Save room</Button></div>
                  </form>

                  <div className="mt-4 space-y-3">
                    {room.bookshelves.map((shelf) => (
                      <div key={shelf.id} className="rounded-2xl border border-blue-border bg-white/70 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-deep-brown">{shelf.name}</h4>
                              <Badge>{shelf.rowCount} rows</Badge>
                              <Badge variant="blue">{shelf.depthCount} depth</Badge>
                              <Badge variant="pink">{shelf.slots.length} slots</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-text">{shelf.sceneKey}</p>
                          </div>
                          <ReorderAndDelete id={shelf.id} reorderAction={reorderBookshelfAction} deleteAction={deleteBookshelfAction} deleteLabel="Delete shelf" />
                        </div>
                        <form action={updateBookshelfAction} className="mt-4 grid gap-3 md:grid-cols-6">
                          <input type="hidden" name="id" value={shelf.id} />
                          <SelectField label="Room" name="roomId" defaultValue={shelf.roomId} options={rooms.map((item) => ({ value: item.id, label: `${item.levelName} / ${item.name}` }))} />
                          <Field label="Shelf name" name="name" defaultValue={shelf.name} />
                          <Field label="Scene key" name="sceneKey" defaultValue={shelf.sceneKey} />
                          <NumberField label="Rows" name="rowCount" defaultValue={shelf.rowCount} min={1} />
                          <NumberField label="Depth" name="depthCount" defaultValue={shelf.depthCount} min={1} />
                          <NumberField label="Order" name="sortOrder" defaultValue={shelf.sortOrder} />
                          <NumberField label="Width" name="widthUnits" defaultValue={shelf.widthUnits} min={1} />
                          <label className="md:col-span-4 text-sm font-semibold text-deep-brown">
                            Notes
                            <input name="notes" defaultValue={shelf.notes ?? ""} className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage" />
                          </label>
                          <div className="flex items-end"><Button type="submit" size="sm">Save shelf</Button></div>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
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
    <Card title="Add level" variant="cream">
      <form action={createLevelAction} className="mt-4 space-y-3">
        <Field label="Level name" name="name" placeholder="Basement" />
        <Field label="Scene key" name="sceneKey" placeholder="level.basement" />
        <NumberField label="Order" name="sortOrder" defaultValue={10} />
        <Button type="submit" size="sm">Add level</Button>
      </form>
    </Card>
  );
}

function CreateRoomForm({ levels }: { levels: { id: string; name: string }[] }) {
  return (
    <Card title="Add room" variant="pink">
      <form action={createRoomAction} className="mt-4 space-y-3">
        <SelectField label="Level" name="levelId" options={levels.map((level) => ({ value: level.id, label: level.name }))} />
        <Field label="Room name" name="name" placeholder="Living Room" />
        <Field label="Scene key" name="sceneKey" placeholder="room.downstairs.living-room" />
        <NumberField label="Order" name="sortOrder" defaultValue={10} />
        <Button type="submit" size="sm">Add room</Button>
      </form>
    </Card>
  );
}

function CreateBookshelfForm({ rooms }: { rooms: { id: string; name: string; levelName: string }[] }) {
  return (
    <Card title="Add bookshelf" variant="blue">
      <form action={createBookshelfAction} className="mt-4 space-y-3">
        <SelectField label="Room" name="roomId" options={rooms.map((room) => ({ value: room.id, label: `${room.levelName} / ${room.name}` }))} />
        <Field label="Shelf name" name="name" placeholder="Living Room Shelf" />
        <Field label="Scene key" name="sceneKey" placeholder="shelf.downstairs.living-room.main" />
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Rows" name="rowCount" defaultValue={4} min={1} />
          <NumberField label="Depth" name="depthCount" defaultValue={2} min={1} />
          <NumberField label="Order" name="sortOrder" defaultValue={10} />
        </div>
        <NumberField label="Width" name="widthUnits" defaultValue={1} min={1} />
        <input type="hidden" name="notes" value="" />
        <Button type="submit" size="sm">Add bookshelf</Button>
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
    <div className="flex flex-wrap gap-2">
      <form action={reorderAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="up" />
        <Button type="submit" variant="outline" size="sm">↑</Button>
      </form>
      <form action={reorderAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="down" />
        <Button type="submit" variant="outline" size="sm">↓</Button>
      </form>
      <form action={deleteAction}>
        <input type="hidden" name="id" value={id} />
        <Button type="submit" variant="secondary" size="sm">{deleteLabel}</Button>
      </form>
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
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-deep-brown">
      {label}
      <select name={name} defaultValue={defaultValue} required className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage">
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
