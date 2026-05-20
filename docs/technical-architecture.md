# Technical Architecture

This is the active architecture reference after Stage 22. Historical step-by-step plans were consolidated into `docs/current-stage.md` and `docs/remaining-project-guide.md`.

## Stack

- Next.js App Router and React.
- TypeScript.
- Tailwind CSS.
- PostgreSQL through Docker Compose.
- Prisma 6.
- Zod.
- ZXing for barcode scanning.
- Tesseract.js for optional OCR.

## Runtime services

Docker Compose runs:

```txt
web
postgres
```

Persistent storage:

- PostgreSQL volume for relational data.
- App data directory/volume for cached covers, uploads, and future backup bundles.

The app is intended to stay private/local. Do not add public auth unless project direction changes. Do protect API keys from Git, client bundles, logs, and screenshots.

## Server/API architecture

- Server-side business rules live in `lib/db/*` service modules.
- Server actions are the primary UI boundary for mutations and client-initiated queries.
- Zod validates user-facing inputs.
- Client components must not call Prisma directly.
- Server-only secrets and provider calls stay out of client components.
- OCR logic lives in `lib/scan/ocr.ts`; server actions and API routes are thin adapters around it.
- Metadata lookup is called through a server action from client components.
- Catalog search currently uses a small-library strategy: Prisma loads book/copy/location data for server-side JavaScript ranking, and the UI limits rendering with a 24-item `Load more` pattern.

Important service files:

- `lib/db/books.ts`
- `lib/db/copies.ts`
- `lib/db/locations.ts`
- `lib/db/loans.ts`
- `lib/db/metadata.ts`
- `lib/db/houseBrowser.ts`
- `lib/db/settings.ts`
- `lib/scan/ocr.ts`

## Data architecture

The database is the source of truth for:

- books and authors;
- physical copies;
- copy loan status;
- levels, rooms, bookshelves, shelf slots;
- stable scene keys;
- cached metadata;
- cached/uploaded images;
- optional bookshelf placement/layout fields retained for data compatibility.

Model files are not the source of truth for shelf inventory. The active living-room browser runs without any model file.

## Metadata architecture

Implemented providers:

- Open Library.
- Google Books.
- ISBNdb.
- Hardcover.

Provider rules:

- Manual entry always works without providers.
- Provider failures are non-blocking.
- User-entered fields win over provider data.
- Metadata and covers are cached locally.
- Hardcover and other provider keys can come from environment variables or local token files.
- API keys must not be committed or printed.

## Scan/OCR architecture

- Barcode scanning starts only after a user action.
- Camera blocked/unsupported paths fall back to manual ISBN entry.
- OCR is optional and upload-based.
- OCR extracts ISBN candidates; the user reviews before saving.
- OCR logic lives in `lib/scan/ocr.ts`; the server action and API route are thin adapters.
- Any future shelf-photo catalogue should follow the same review-before-write rule.

## 2D and room-view architecture

2D and room/shelf browsers both read from `lib/db/houseBrowser.ts`.

The Stage 19/20 primary browser is an app-rendered straight-on living-room view:

- `/` and `/house/3d` render `components/house/LivingRoomBookshelfBrowser.tsx`.
- The old full-house GLB asset has been removed.
- A future browser-ready room model can be added under `public/models` without changing shelf scene keys, but it is not required.

Bookshelves, shelf rows, individual book spines, switching motion, and hover states are app-generated from database data.

The old full-house React Three Fiber scene, GLB helper picking, browser-local test bookcases, and transform/edit controls are no longer part of the active runtime.

## Offline/local behavior

Expected v1 offline behavior:

- saved catalog data works;
- saved location data works;
- cached covers serve locally;
- manual add/edit still works;
- metadata refresh fails gracefully if internet/providers are unavailable.

## Known limits and deferred recovery work

- Catalog search is intended for private libraries of hundreds to a few thousand books. Move coarse search/filtering into PostgreSQL full-text or trigram indexes before expecting tens of thousands of records.
- The catalog page renders 24 books at a time and exposes `Load more` for larger result sets, but the ranking pass still runs in the app process.
- Import/export backup workflows are intentionally deferred. The direct `/import-export` page explains the status, and primary navigation does not present it as a ready tool.
- Use PostgreSQL backups or Docker volume snapshots for recovery until app-level export/import previews are implemented.

Optional future offline work may add service-worker caching for static assets, but it must not complicate data correctness.
