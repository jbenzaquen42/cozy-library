import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { HouseBrowserShelf } from "@/lib/db/houseBrowser";

export function SelectedShelfPanel({ shelf }: { shelf: HouseBrowserShelf | null }) {
  if (!shelf) {
    return (
      <Card variant="cream" title="Selected shelf" className="h-full">
        <p className="text-sm text-muted-text">Click a shelf in the house to see its slots and books.</p>
      </Card>
    );
  }

  const copyCount = shelf.slots.reduce((total, slot) => total + slot.copies.length, 0);

  return (
    <Card variant="white" title={shelf.name} className="h-full">
      <div className="space-y-4">
        <div className="space-y-1 text-sm text-muted-text">
          <p>{shelf.levelName} / {shelf.roomName}</p>
          <p className="font-mono text-xs">{shelf.sceneKey}</p>
          <p>{copyCount} {copyCount === 1 ? "copy" : "copies"} across {shelf.rowCount} rows × {shelf.depthCount} depth</p>
        </div>

        <div className="grid gap-2">
          {shelf.slots.map((slot) => (
            <div key={slot.id} className="rounded-2xl border border-warm-border bg-cream/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-deep-brown">{slot.label}</p>
                <span className="rounded-full bg-white px-2 py-1 text-xs text-muted-text">{slot.copies.length}</span>
              </div>
              {slot.copies.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {slot.copies.map((copy) => (
                    <li key={copy.id} className="text-sm">
                      <Link href={`/books/${copy.bookId}`} className="font-semibold text-deep-brown underline-offset-2 hover:underline">
                        {copy.title}
                      </Link>
                      <p className="text-xs text-muted-text">
                        Copy {copy.copyLabel} · {copy.displayAuthor} · {copy.status.toLowerCase()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted-text">Empty slot</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
