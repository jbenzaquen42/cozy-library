import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listLocations } from "@/lib/db/locations";
import { searchCatalog } from "@/lib/search/catalog";
import { searchInputSchema, type SearchInput } from "@/lib/validation/search";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type LocationLevels = Awaited<ReturnType<typeof listLocations>>;
type LocationLevel = LocationLevels[number];
type LocationRoom = LocationLevel["rooms"][number] & { levelName?: string };
type LocationShelf = LocationRoom["bookshelves"][number] & { roomName?: string; levelName?: string };

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const rawParams = await searchParams;
  const input = parseSearchParams(rawParams);
  const [catalogResults, levels] = await Promise.all([searchCatalog(input), listLocations({ includeSlots: true })]);
  const view = input.view;
  const rooms = levels.flatMap((level: LocationLevel) => level.rooms.map((room: LocationLevel["rooms"][number]) => ({ ...room, levelName: level.name })));
  const shelves = rooms.flatMap((room: LocationRoom) => room.bookshelves.map((shelf: LocationRoom["bookshelves"][number]) => ({ ...shelf, roomName: room.name, levelName: room.levelName })));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader label="Library shelves" title="Catalog">
        <Button href="/books/new" size="sm">Add book manually</Button>
      </PageHeader>

      <Card variant="cream">
        <form className="grid gap-3 md:grid-cols-4">
          <label className="md:col-span-2 text-sm font-semibold text-deep-brown">
            Search
            <input name="query" defaultValue={input.query} placeholder="Title, author, ISBN, room, shelf…" className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage" />
          </label>
          <Select name="availability" label="Availability" value={input.availability} options={[{ value: "all", label: "All" }, { value: "available", label: "Available" }, { value: "loaned", label: "Loaned" }]} />
          <Select name="view" label="View" value={view} options={[{ value: "grid", label: "Grid" }, { value: "list", label: "List" }]} />
          <Select name="levelSceneKey" label="Level" value={input.levelSceneKey} options={[{ value: "", label: "Any level" }, ...levels.map((level: LocationLevel) => ({ value: level.sceneKey, label: level.name }))]} />
          <Select name="roomSceneKey" label="Room" value={input.roomSceneKey} options={[{ value: "", label: "Any room" }, ...rooms.map((room: LocationRoom) => ({ value: room.sceneKey, label: `${room.levelName} / ${room.name}` }))]} />
          <Select name="bookshelfSceneKey" label="Bookshelf" value={input.bookshelfSceneKey} options={[{ value: "", label: "Any shelf" }, ...shelves.map((shelf: LocationShelf) => ({ value: shelf.sceneKey, label: `${shelf.levelName} / ${shelf.roomName} / ${shelf.name}` }))]} />
          <NumberInput name="rowIndex" label="Row" value={input.rowIndex} />
          <NumberInput name="depthIndex" label="Depth" value={input.depthIndex} />
          <label className="text-sm font-semibold text-deep-brown">
            Author
            <input name="author" defaultValue={input.author ?? ""} className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage" />
          </label>
          <label className="text-sm font-semibold text-deep-brown">
            Category
            <input name="category" defaultValue={input.category ?? ""} className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage" />
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit" size="sm">Search</Button>
            <Button href="/catalog" variant="outline" size="sm">Reset</Button>
          </div>
        </form>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-text">
        <p>
          {catalogResults.totalCount} {catalogResults.totalCount === 1 ? "result" : "results"}
          {catalogResults.totalCount > 0 ? ` · showing ${catalogResults.shownCount}` : ""}
        </p>
        {input.query ? <p>Best shelf matches appear first.</p> : null}
      </div>

      {catalogResults.totalCount === 0 ? (
        <EmptyState title="No matching books" message="Try a broader search, or add the book by hand." action={{ label: "Add book manually", href: "/books/new" }} />
      ) : (
        <>
          <div className={view === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
            {catalogResults.items.map(({ book, rank }: Awaited<ReturnType<typeof searchCatalog>>["items"][number]) => (
              <BookCard key={book.id} book={book} rank={rank} view={view} />
            ))}
          </div>
          {catalogResults.hasNextPage ? (
            <div className="flex justify-center pt-2">
              <Button href={catalogPageHref(input, catalogResults.page + 1)} variant="outline">Load more books</Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function parseSearchParams(params: Record<string, string | string[] | undefined>): SearchInput {
  const value = (key: string) => {
    const item = params[key];
    return Array.isArray(item) ? item[0] : item;
  };

  return searchInputSchema.parse({
    query: value("query") ?? "",
    availability: value("availability") || "all",
    levelSceneKey: value("levelSceneKey") || undefined,
    roomSceneKey: value("roomSceneKey") || undefined,
    bookshelfSceneKey: value("bookshelfSceneKey") || undefined,
    rowIndex: value("rowIndex") || undefined,
    depthIndex: value("depthIndex") || undefined,
    author: value("author") || undefined,
    category: value("category") || undefined,
    view: value("view") || "grid",
    page: value("page") || undefined,
  });
}

function catalogPageHref(input: SearchInput, page: number) {
  const params = new URLSearchParams();
  const append = (key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  };

  append("query", input.query.trim());
  if (input.availability !== "all") append("availability", input.availability);
  append("levelSceneKey", input.levelSceneKey);
  append("roomSceneKey", input.roomSceneKey);
  append("bookshelfSceneKey", input.bookshelfSceneKey);
  append("rowIndex", input.rowIndex);
  append("depthIndex", input.depthIndex);
  append("author", input.author);
  append("category", input.category);
  if (input.view !== "grid") append("view", input.view);
  if (page > 1) append("page", page);

  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

function Select({ name, label, value, options }: { name: string; label: string; value?: string; options: { value: string; label: string }[] }) {
  return (
    <label className="text-sm font-semibold text-deep-brown">
      {label}
      <select name={name} defaultValue={value ?? ""} className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage">
        {options.map((option: { value: string; label: string }) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function NumberInput({ name, label, value }: { name: string; label: string; value?: number }) {
  return (
    <label className="text-sm font-semibold text-deep-brown">
      {label}
      <input type="number" min={1} name={name} defaultValue={value ?? ""} className="mt-1 w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage" />
    </label>
  );
}

function BookCard({ book, rank, view }: { book: CatalogBook; rank: number; view: "grid" | "list" }) {
  const availableCount = book.copies.filter((copy: CatalogBook["copies"][number]) => copy.status === "AVAILABLE").length;
  const locationSummary = summarizeLocations(book.copies);

  return (
    <Link href={`/books/${book.id}`}>
      <Card variant="white" className={`h-full transition hover:-translate-y-0.5 hover:shadow-xl ${view === "list" ? "md:flex md:items-center md:justify-between md:gap-6" : ""}`}>
        <div>
          {book.coverImagePath ? (
              // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverImagePath} alt={`Cover for ${book.title}`} width={80} height={112} loading="lazy" className="mb-3 h-28 w-20 rounded-2xl object-cover shadow-md" />
          ) : (
            <div className="mb-3 flex h-24 w-20 items-center justify-center rounded-2xl bg-baby-blue/30 text-3xl">📚</div>
          )}
          <h2 className="font-heading text-xl font-semibold text-deep-brown">{book.title}</h2>
          <p className="text-muted-text">{book.displayAuthor}</p>
          <p className="mt-2 text-sm text-soft-brown">{locationSummary}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="blue">{book.copies.length} {book.copies.length === 1 ? "copy" : "copies"}</Badge>
          <Badge>{availableCount} available</Badge>
          {book.isbn13 ? <Badge variant="pink">ISBN {book.isbn13}</Badge> : null}
          {Number.isFinite(rank) && rank !== 100 ? <Badge variant="brown">Rank {rank}</Badge> : null}
        </div>
      </Card>
    </Link>
  );
}

type CatalogBook = Awaited<ReturnType<typeof searchCatalog>>["items"][number]["book"];

function summarizeLocations(copies: CatalogBook["copies"]) {
  if (copies.length === 0) return "No physical copies yet";
  const names = Array.from(new Set(copies.map((copy: CatalogBook["copies"][number]) => copy.locationSlot ? `${copy.locationSlot.bookshelf.room.name} / ${copy.locationSlot.bookshelf.name}` : "Waiting for a shelf spot")));
  return names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}
