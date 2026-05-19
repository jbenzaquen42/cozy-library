# Current Stage

## Stage 0: Repository foundation

### Goal

Create a clean Next.js App Router project skeleton with TypeScript, Tailwind CSS, ESLint, npm scripts, base folders, environment example, and placeholder documentation.

### Files expected to change

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `eslint.config.mjs`
- `postcss.config.mjs`
- `app/*`
- base folders under `components`, `lib`, `prisma`, `public/models`, `tests`
- `.env.example`
- `README.md`
- `AGENTS.md`
- placeholder docs

### Explicitly out of scope

- Database models and Prisma schema
- Docker and PostgreSQL runtime
- Scanning
- Metadata lookup
- 2D house navigation
- 3D house navigation

### Commands that must pass before moving on

- `npm install`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results

Completed.

- Created the Next.js App Router shell with TypeScript and Tailwind CSS.
- Added ESLint, TypeScript config, npm scripts, base directories, `.env.example`, README, and placeholder docs.
- Confirmed `/` renders the basic app shell.

### Commands run

- `npm install`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npx next start -p 3000` with an HTTP check for `/`

### Known issues

- `npm install` reported two moderate dependency audit findings. They are not blocking Stage 0 checks.

### Next stage readiness

Stage 1 can safely begin.

---

## Stage 1: Docker and PostgreSQL foundation

### Goal

Make the app run with PostgreSQL in Docker Compose.

### Files expected to change

- `docker-compose.yml`
- `Dockerfile`
- `.dockerignore`
- `next.config.ts`
- `app/settings/page.tsx`
- `README.md`
- `docs/current-stage.md`

### Explicitly out of scope

- Prisma schema
- Database models or migrations
- Catalog features
- Scanning
- Metadata lookup
- Import/export
- 2D house navigation
- 3D house navigation

### Commands that must pass before moving on

- `docker compose up --build`
- HTTP check for `http://localhost:3000`
- HTTP check for `http://localhost:3000/settings`
- PostgreSQL health check and container restart check

### Results

Completed.

- Added Docker Compose with `web` and `postgres` services.
- Added PostgreSQL 16 with a `postgres-data` named volume and health check.
- Added production Dockerfile for the standalone Next.js build.
- Added `library-data` named volume mounted at `/data`.
- Updated `/settings` with placeholder database configuration status and app data directory.
- Documented Docker startup and data removal commands in README.

### Commands run

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `docker --version && docker compose version`
- `docker compose up --build -d`
- HTTP checks for `/` and `/settings`
- `docker compose ps`
- `docker inspect cozy-library-postgres-1 --format '{{.State.Health.Status}}'`
- PostgreSQL persistence check across `docker compose restart postgres`
- `docker compose down`

### Known issues

- `npm install` and Docker `npm ci` reported two moderate dependency audit findings. They were not blocking the Stage 0 or Stage 1 exit checks.
- `/settings` shows placeholder database status only. Real database connectivity belongs in Stage 2 with database utilities.

### Next stage readiness

Stage 2 can safely begin.

---

## Stage 3: Seed the default house and scene keys

### Goal

Create the exact default house layout, generate all shelf slots, make seeding idempotent, document scene-key rules, and test slot generation.

### Prerequisite note

The repository did not contain Stage 2 Prisma files. To make the requested Stage 3 seed runnable, this stage adds only the minimal location schema and Prisma seed wiring needed for levels, rooms, bookshelves, and shelf slots. It does not add catalog, loan, metadata, scanning, admin UI, 2D, or 3D behavior.

### Files expected to change

- `package.json`
- `package-lock.json`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `lib/scene/defaultSceneKeys.ts`
- `docs/data-model-and-scene-keys.md`
- `tests/unit/defaultSceneKeys.test.ts`
- `docs/current-stage.md`

### Explicitly out of scope

- Location admin UI
- 2D house navigation
- 3D views
- Catalog features
- Scanning
- Metadata lookup

### Commands that must pass before moving on

- `npx prisma generate`
- `npx prisma db push`
- `npm run db:seed`
- `npm run test`
- `npm run typecheck`

### Results

Completed.

- Added minimal Prisma location models required to persist the default house hierarchy.
- Added an idempotent seed for 2 levels, 3 rooms, 5 bookshelves, and 44 shelf slots.
- Added reusable default scene-key constants and slot generation helpers.
- Added unit tests for the default layout and shelf slot generation.
- Expanded scene-key documentation with the exact default object names and slot rules.

### Commands run

- `npm install @prisma/client && npm install -D prisma tsx`
- `npm install @prisma/client@6 prisma@6`
- `npm run db:generate`
- `docker compose up -d postgres`
- `npm run db:push`
- `npm run db:seed`
- `npm run db:seed` again to verify idempotency
- PostgreSQL count query: `2,3,5,44`
- PostgreSQL shelf slot count query
- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `docker compose down`

### Results from validation

- Seed passed and remained idempotent on the second run.
- Seeded counts: 2 levels, 3 rooms, 5 bookshelves, 44 shelf slots.
- Unit tests passed: 1 file, 4 tests.
- Typecheck passed.
- Lint passed.

### Known issues

- Prisma seed support uses `package.json#prisma`, which emits a Prisma 6 deprecation warning for future Prisma 7 migration. It does not block Stage 3.

### Next stage readiness

The default house seed and scene keys are ready for later location and visual browsing stages.

---

## Stage 4: tRPC, Zod schemas, and service layer

### Goal

Create typed API foundations, Zod validation schemas, server-side service modules, and consistent AppError handling. Add only minimal UI changes proving settings and location listing work.

### Files expected to change

- `package.json`
- `package-lock.json`
- `app/api/trpc/[trpc]/route.ts`
- `app/settings/page.tsx`
- `app/locations/page.tsx`
- `lib/api/**`
- `lib/db/**`
- `lib/validation/**`
- `lib/errors.ts`
- `tests/unit/services.test.ts`
- `docs/current-stage.md`

### Explicitly out of scope

- Polished forms
- Location admin editing UI
- Metadata provider calls
- Catalog features
- Scanning
- 2D house navigation
- 3D views

### Commands that must pass before moving on

- `npm run test`
- `npm run lint`
- `npm run typecheck`

### Results

Completed.

- Added tRPC route handler at `/api/trpc/[trpc]` and root router composition.
- Added routers for settings, locations, books, copies, loans, metadata, search, and import/export.
- Added Zod schemas for location, book/copy/loan, metadata lookup, search, and CSV import inputs.
- Added service modules for settings and locations, plus bounded placeholders for later-stage domains.
- Added consistent `AppError` and tRPC error formatting.
- Updated `/settings` to show real database connectivity through the settings service.
- Added `/locations` as a minimal service-layer proof page for the seeded house layout.
- Added service tests for location listing, location summary, settings status, and AppError serialization.

### Commands run

- `npm install @trpc/server @trpc/client zod superjson`
- `npm run typecheck`
- `docker compose up -d postgres`
- `npm run db:push`
- `npm run db:seed`
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- HTTP checks for `/settings`, `/locations`, and `/api/trpc/location.summary`
- `docker compose down`

### Results from validation

- Service tests passed: 2 files, 8 tests.
- Lint passed.
- Typecheck passed.
- Build passed.
- `/settings` returned 200 and showed database connected.
- `/locations` returned 200 and showed seeded shelves.
- tRPC `location.summary` returned 200 and included counts.

### Known issues

- Later-stage routers exist but mutations/provider behavior intentionally return placeholder data or `NOT_IMPLEMENTED` until their stages.
- Prisma 6 still warns that `package.json#prisma` seed config is deprecated for Prisma 7.

### Next stage readiness

Stage 5 can safely begin.

---

## Stage 5: Cozy UI foundation

### Goal

Create shared UI components, theme tokens, app shell, navigation, route pages, loading states, empty states, and error messages. Preserve existing service/tRPC code. Ensure all required routes load without 404. Keep visual style cozy.

### Files expected to change

- `package.json`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/settings/page.tsx`
- `app/locations/page.tsx`
- `app/loading.tsx`
- `app/error.tsx`
- `app/not-found.tsx`
- `app/catalog/page.tsx`
- `app/books/new/page.tsx`
- `app/scan/page.tsx`
- `app/house/page.tsx`
- `app/house/2d/page.tsx`
- `app/house/3d/page.tsx`
- `app/loans/page.tsx`
- `app/import-export/page.tsx`
- `app/*/loading.tsx` (per-route loading states)
- `lib/utils.ts`
- `components/app-shell.tsx`
- `components/side-nav.tsx`
- `components/bottom-nav.tsx`
- `components/mobile-menu.tsx`
- `components/ui/card.tsx`
- `components/ui/button.tsx`
- `components/ui/badge.tsx`
- `components/ui/loading-spinner.tsx`
- `components/ui/empty-state.tsx`
- `components/ui/error-message.tsx`
- `components/ui/page-header.tsx`
- `components/ui/skeleton.tsx`
- `components/ui/skeleton-page.tsx`
- `docs/current-stage.md`

### Explicitly out of scope

- Catalog behavior (search, filtering, book detail)
- Scanning behavior (camera, OCR, barcode)
- Metadata provider calls
- Location admin editing UI
- 2D house navigation behavior
- 3D runtime dependencies or rendering

### Commands that must pass before moving on

- `npm install`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results

Completed.

- Added cozy color theme tokens (parchment, cream, baby blue, light pink, soft brown, sage, soft red) to Tailwind CSS v4 theme.
- Added `Crimson Pro` display font and `Nunito` body font via `next/font/google`.
- Created reusable UI components under `components/ui`: Card, Button, Badge, LoadingSpinner, EmptyState, ErrorMessage, PageHeader, Skeleton, SkeletonPage.
- Created app shell with responsive navigation: desktop side nav, mobile bottom nav with "More" menu.
- Updated `/`, `/settings`, and `/locations` to use shared components and removed redundant layout wrappers.
- Added placeholder pages for `/catalog`, `/books/new`, `/scan`, `/house`, `/house/2d`, `/house/3d`, `/loans`, and `/import-export`.
- Added route-level `loading.tsx` files using a shared skeleton component.
- Added root `error.tsx` and `not-found.tsx` with cozy styling.
- Preserved all existing service/tRPC code without changes.
- No catalog behavior, scanning behavior, or 3D runtime dependencies were added.

### Commands run

- `npm install`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results from validation

- All required routes return 200: `/`, `/catalog`, `/books/new`, `/scan`, `/house`, `/house/2d`, `/house/3d`, `/locations`, `/loans`, `/import-export`, `/settings`.
- Lint passed.
- Typecheck passed.
- Build passed.

### Known issues

- None blocking.

### Next stage readiness

Stage 6 can safely begin.

---

## Stage 6: Location admin and shelf slot management

### Goal

Build `/locations` into an admin page for editing levels, rooms, bookshelves, row count, depth count, and sort order while protecting occupied shelf slots from destructive changes.

### Files expected to change

- `prisma/schema.prisma`
- `app/locations/page.tsx`
- `app/locations/actions.ts`
- `lib/db/locations.ts`
- `lib/api/routers/location.ts`
- `lib/validation/location.ts`
- `tests/unit/services.test.ts`
- `docs/current-stage.md`

### Explicitly out of scope

- 2D house browsing
- 3D house browsing
- Catalog behavior beyond the minimal copy relation needed to test occupied slot protection
- Scanning
- Metadata providers

### Commands that must pass before moving on

- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results

Completed.

- Added location admin server actions for creating, editing, deleting, and reordering levels, rooms, and bookshelves.
- Added tRPC mutations for the same location operations.
- Added bookshelf row/depth resizing that creates new shelf slots when expanding.
- Added protection that blocks shrinking rows/depths when removed slots contain copies.
- Added protection that blocks deleting occupied bookshelves, rooms, or levels.
- Added minimal `Book`, `Copy`, and `CopyStatus` schema pieces needed to enforce occupied slot protection; no catalog UI or book behavior was implemented.
- Rebuilt `/locations` with simple admin forms, reorder controls, delete controls, and save/error feedback.
- Added service tests for slot generation on create/expand and occupied-slot shrink/delete protection.

### Commands run

- `npm run db:generate`
- `docker compose up -d postgres`
- `npm run db:push`
- `npm run db:seed`
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `docker compose down`

### Results from validation

- Related tests passed: 2 files, 10 tests.
- Lint passed.
- Typecheck passed.
- Build passed.

### Known issues

- Prisma 6 still warns that `package.json#prisma` seed config is deprecated for Prisma 7.
- The admin page uses simple server-action forms rather than polished modal workflows.
- The repository still has schema/migration debt because Stage 2 was not fully completed before Stage 3-6 work. Stage 6 added only minimal `Book`, `Copy`, and `CopyStatus` models to enforce occupied shelf protection.
- `/locations` delete controls are simple submit buttons. Add confirmation UI in a future polish pass, or as part of Stage 7 if touching destructive book/copy flows.
- `listLocations(includeSlots)` currently always includes slots because the admin page needs slot counts. Restore true conditional behavior if a lightweight location list becomes important.

### Next stage readiness

Stage 7 can safely begin only after a short schema/migration catch-up at the start of the stage.

### Required pre-Stage 7 catch-up

Before building manual book UI, do this first:

1. Create a real Prisma migration baseline instead of relying only on `prisma db push`.
2. Reconcile the catalog schema with the planned data model:
   - expand `Book` beyond the Stage 6 minimal fields;
   - add `isbn10` and `isbn13` as nullable unique fields;
   - add `Author` and `BookAuthor`;
   - add planned `Copy` fields such as `condition`, `notes`, and safe status/location constraints.
3. Change `Book -> Copy` deletion away from unsafe cascade behavior. Use safe service-layer deletion rules for books with copies.
4. Add and test copy label assignment (`1`, `2`, `3`) and consider `@@unique([bookId, copyLabel])`.
5. Keep ISBN blanks as `null`, not empty strings, so unique constraints do not conflict.

---

## Stage 7: Manual book and copy management

### Goal

Build manual book creation and editing with exact shelf-slot assignment, book detail pages, copy creation, copy label rename, copy movement, and safe copy deletion.

### Files expected to change

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `lib/validation/book.ts`
- `lib/db/books.ts`
- `lib/db/copies.ts`
- `lib/api/routers/book.ts`
- `lib/api/routers/copy.ts`
- `app/books/actions.ts`
- `app/books/new/page.tsx`
- `app/books/[id]/page.tsx`
- `app/books/[id]/edit/page.tsx`
- `app/catalog/page.tsx`
- `tests/unit/defaultSceneKeys.test.ts`
- `tests/unit/services.test.ts`
- `docs/current-stage.md`

### Explicitly out of scope

- Metadata lookup providers
- Barcode scanning
- OCR/photo upload
- Catalog search and filters
- Loan/return behavior
- 2D house browsing
- 3D house browsing

### Commands that must pass before moving on

- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results

Completed.

- Reconciled the catalog schema enough for manual entry: expanded `Book`, added `Author`, `BookAuthor`, richer `Copy`, nullable unique ISBN fields, and safer copy relations.
- Added a Prisma migration baseline for the current catalog/location schema.
- Implemented manual book creation with first copy label `1` and exact shelf-slot assignment.
- Implemented book detail and edit pages.
- Implemented add copy, automatic next copy label, rename copy, move copy, and delete copy when safe.
- Added service-layer ISBN normalization so blank ISBN fields become `null`.
- Added simple catalog listing that links to book details without implementing search/filter behavior.
- Added copy-label tests and kept occupied-slot protection tests passing.

### Commands run

- `npm run db:generate`
- `docker compose up -d postgres`
- `npm run db:push` (initially blocked by new unique constraints warning)
- `npx prisma db push --accept-data-loss`
- `npm run db:seed`
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `docker compose down`

### Results from validation

- Copy-label and related tests passed: 2 files, 12 tests.
- Lint passed.
- Typecheck passed.
- Build passed.

### Known issues

- `prisma db push --accept-data-loss` was needed in the existing development database because unique constraints were added after earlier `db push` work. Fresh databases should use the migration baseline.
- Prisma 6 still warns that `package.json#prisma` seed config is deprecated for Prisma 7.
- Book/copy forms are functional server-action forms, not polished modal workflows.

### Next stage readiness

Stage 8 can safely begin.

---

## Stage 8: Catalog search and filters

### Goal

Make catalog browsing useful with search, filters, grid/list toggle, book cards, ranking, and location filtering.

### Files expected to change

- `app/catalog/page.tsx`
- `lib/search/catalog.ts`
- `lib/validation/search.ts`
- `lib/api/routers/search.ts`
- `tests/unit/catalogSearch.test.ts`
- `docs/current-stage.md`

### Explicitly out of scope

- House maps
- 3D views
- Metadata lookup
- Barcode scanning
- OCR
- Loan/return behavior

### Commands that must pass before moving on

- `npm run test -- catalogSearch`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results

Completed.

- Implemented catalog search ranking for exact ISBN, exact title, prefix title, fuzzy/title contains, author, category, location, and copy notes.
- Added catalog filters for availability, level, room, bookshelf, row, depth, author, and category.
- Added grid/list toggle using query parameters.
- Rebuilt `/catalog` with a search/filter form, book cards, availability counts, copy counts, ISBN badges, and location summaries.
- Wired the search tRPC router to the catalog search service.
- Added search ranking and filter unit tests.

### Commands run

- `npm run typecheck`
- `docker compose up -d postgres`
- `npm run db:push`
- `npm run db:seed`
- `npm run test -- catalogSearch`
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `docker compose down`

### Results from validation

- Search tests passed: 1 file, 3 tests.
- Full test suite passed: 3 files, 15 tests.
- Lint passed.
- Typecheck passed.
- Build passed.

### Known issues

- Search ranking is implemented in the service layer for the current small household-library scale. PostgreSQL `pg_trgm` and full-text ranking should be added when Stage 8 is hardened further or before larger imports.
- Categories are supported by the search service but manual book forms do not yet edit categories.

### Next stage readiness

Stage 9 can safely begin.

---

## Stage 9: Simple loan tracking

### Goal

Add borrower-name-only loan and return workflows, active loans page, loan history, and dashboard active-loans summary.

### Files expected to change

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `lib/validation/book.ts`
- `lib/db/loans.ts`
- `lib/db/books.ts`
- `lib/api/routers/loan.ts`
- `app/loans/actions.ts`
- `app/loans/page.tsx`
- `app/books/[id]/page.tsx`
- `app/page.tsx`
- `tests/unit/loans.test.ts`
- `docs/current-stage.md`

### Explicitly out of scope

- Due dates
- Reminders
- Borrower contacts beyond optional notes
- Metadata lookup
- Barcode scanning
- OCR
- 2D or 3D browsing

### Commands that must pass before moving on

- `npm run test -- loans`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results

Completed.

- Added `Loan` model with borrower name, loan date, return date, and optional notes.
- Added loan services for active loan listing, loaning a copy, returning a copy, duplicate active-loan prevention, and copy status transitions.
- Added loan tRPC routes and server actions.
- Added loan/return controls to book detail copies.
- Added loan history display on book detail copies.
- Rebuilt `/loans` with active loans, return actions, and returned-loan history.
- Added dashboard active-loans summary.
- Added loan transition tests.

### Commands run

- `npm run db:generate`
- `docker compose up -d postgres`
- `npm run db:push`
- `npm run db:seed`
- `npm run test -- loans`
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `docker compose down`

### Results from validation

- Loan tests passed: 1 file, 2 tests.
- Full test suite passed: 4 files, 17 tests.
- Lint passed.
- Typecheck passed.
- Build passed.

### Known issues

- Prisma 6 still warns that `package.json#prisma` seed config is deprecated for Prisma 7.
- The development server that was previously running on localhost was stopped so Prisma Client could regenerate on Windows.

### Next stage readiness

Stage 10 can safely begin.

---

## Stage 10: Metadata providers and cover caching

### Goal

Add external metadata lookup with Open Library, Google Books, optional ISBNdb, metadata caching, merge logic, source display, refresh metadata, cover download, and local cover serving.

### Files expected to change

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `lib/metadata/**`
- `lib/db/metadata.ts`
- `lib/api/routers/metadata.ts`
- `app/books/actions.ts`
- `app/books/[id]/page.tsx`
- `app/covers/[file]/route.ts`
- `tests/unit/metadata.test.ts`
- `docs/current-stage.md`

### Explicitly out of scope

- Barcode scanner
- OCR/photo upload
- Camera permission flow
- AI visual recognition

### Commands that must pass before moving on

- `npm run test -- metadata`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results

Completed.

- Added `MetadataCache`, `UploadedImage`, and `UploadedImageKind` schema.
- Added Open Library ISBN lookup with contact-email User-Agent.
- Added Google Books lookup with optional API key.
- Added optional ISBNdb lookup when `ISBNDB_API_KEY` exists.
- Added metadata cache read/write by provider and lookup key.
- Added metadata merge logic where existing user-edited book fields win and provider data fills missing fields.
- Added cover download to `APP_DATA_DIR/covers` and local cover serving at `/covers/[file]`.
- Added book-detail refresh metadata action, cover display, and metadata source badges.
- Added metadata tRPC lookup and refresh endpoints.
- Added metadata merge tests.

### Commands run

- `npm run db:generate`
- `npm run typecheck`
- `docker compose up -d postgres`
- `npm run db:push`
- `npm run db:seed`
- `npm run test -- metadata`
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `docker compose down`

### Results from validation

- Metadata tests passed: 1 file, 2 tests.
- Full test suite passed: 5 files, 19 tests.
- Lint passed.
- Typecheck passed.
- Build passed.

### Known issues

- Provider integration depends on external network availability at runtime.
- Cover caching stores original downloaded image bytes only; generated thumbnails are still a later-stage concern.
- Prisma 6 still warns that `package.json#prisma` seed config is deprecated for Prisma 7.

### Next stage readiness

Stage 11 can safely begin.

---

## Stage 11: Barcode scanning

### Goal

Add phone camera barcode scanning with `@zxing/browser`, camera permission handling, scanner cleanup, blocked-camera fallback, and ISBN-to-metadata-review flow.

### Files expected to change

- `package.json`
- `package-lock.json`
- `app/scan/page.tsx`
- `app/books/new/page.tsx`
- `components/scan/BarcodeScanner.tsx`
- `components/scan/ScanFlow.tsx`
- `lib/isbn/normalize.ts`
- `docs/current-stage.md`

### Explicitly out of scope

- OCR
- Photo upload
- AI visual book recognition
- Due dates/reminders
- 2D or 3D house browsing

### Commands that must pass before moving on

- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results

Completed.

- Installed `@zxing/browser`.
- Added a client-side scanner that starts only after the user clicks Start scanner.
- Added camera permission/blocked-camera messaging and manual fallback.
- Added scanner cleanup on stop, successful scan, and component unmount.
- Added ISBN normalization from scanned barcodes.
- Added metadata lookup review on `/scan` using the existing metadata tRPC endpoint.
- Added a manual ISBN fallback and a link into `/books/new` with metadata-prefilled query parameters.
- Updated `/books/new` to accept prefilled ISBN/metadata query parameters.

### Commands run

- `npm install @zxing/browser`
- `npm run typecheck`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results from validation

- Lint passed.
- Typecheck passed.
- Build passed.

### Known issues

- Camera scanning requires a browser secure context. `localhost` works for local testing; LAN phone use may require HTTPS or a trusted browser context.
- Metadata lookup depends on external provider/network availability.
- No OCR or photo upload is included in this stage.

### Next stage readiness

Stage 12 completed.

---

## Stage 12: Cover/spine photo OCR

### Goal

Add cover/spine photo upload or capture, save original images, run tesseract.js OCR, extract ISBN candidates, let the user select or confirm candidates, and always keep manual entry available.

### Files expected to change

- `package.json`
- `package-lock.json`
- `app/scan/page.tsx`
- `app/scan/actions.ts`
- `app/api/scan-ocr/route.ts`
- `components/scan/PhotoOcr.tsx`
- `lib/isbn/extract.ts`
- `tests/unit/ocrExtract.test.ts`
- `docs/current-stage.md`

### Explicitly out of scope

- Full AI visual book recognition
- Book identification from image pixels only
- Due dates
- 2D or 3D house browsing

### Commands that must pass before moving on

- `npm run test -- ocrExtract`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results

Completed.

- Installed `tesseract.js@5`.
- Added server action to upload an image file, save to `APP_DATA_DIR/uploads`, run OCR, and return ISBN candidates with text preview.
- Added API route `POST /api/scan-ocr` for the OCR flow from client components.
- Added `lib/isbn/extract.ts` with ISBN candidate extraction from OCR text.
- Added client-side photo upload/capture control with OCR state management, collapsible text preview, candidate radio selection, and manual fallback.
- Integrated photo OCR into `/scan` below the barcode scanner.
- Added ISBN extraction unit tests.

### Commands run

- `npm install tesseract.js@5`
- `npm run typecheck`
- `npm run test -- ocrExtract`
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results from validation

- OCR extraction tests passed: 1 file, 5 tests.
- Full test suite: 5 passed, 1 skipped (17 tests passed, 7 skipped due to no DATABASE_URL).
- Lint passed.
- Typecheck passed.
- Build passed.

### Known issues

- tesseract.js worker downloads language data on first run (~30 MB).
- OCR quality depends on image clarity and font legibility.
- Manual entry remains the always-available fallback.

### Next stage readiness

Stage 13 can safely begin.

---

## Stage 13: 2D house browser

### Goal

Create the reliable visual browsing fallback with an SVG 2D house map.

### Status

Completed. Implemented after Stage 14 by request; shared house browsing data and selected shelf panel from Stage 14 are reused rather than duplicated.

### Results

- Rebuilt `/house/2d` as a dynamic 2D house browser backed by database scene keys.
- Added SVG map areas for the downstairs entry, upstairs hallway, and study.
- Added clickable seeded shelf shapes for the entry shelf, three hallway bookcases, and study shelf.
- Added URL selection state with `shelf` and `depth` query parameters.
- Added front/back depth toggle and row grid for the selected shelf.
- Added empty-slot states and book links for occupied slots.
- Reused the shared selected shelf panel and house browser data service created during the out-of-order Stage 14 work.

### Commands run

- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results from validation

- Lint passed.
- Typecheck passed.
- Build passed.

### Known issues

- Stage 13 was completed after Stage 14, so the shared selected shelf panel already existed before this stage began.
- The map is a simple SVG layout for reliable visual browsing, not a measured architectural floor plan.

### Next stage readiness

Stage 15 can safely begin.

---

## Metadata provider addition: Hardcover API

### Goal

Document and integrate Hardcover as an optional server-side metadata provider.

### Status

Completed.

### Results

- Added `cozy_home_library_blender_docs_v3/12_HARDCOVER_API.md` with setup instructions, token verification, endpoint details, GraphQL query, and integration notes.
- Added optional `HARDCOVER_API_TOKEN` configuration to `.env.example` and `docker-compose.yml`.
- Added `hardcover` to metadata provider types and settings status.
- Integrated `lookupHardcover` into the existing metadata lookup/cache flow.
- Added unit coverage for Hardcover response mapping and tokenless skip behavior.

### Commands run

- `npm run test -- metadata`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### Results from validation

- Metadata tests passed: 1 file, 4 tests.
- Typecheck passed.
- Lint passed.
- Build passed.
- Live Hardcover API authentication was not attempted because no `HARDCOVER_API_TOKEN` value was provided in the session.

### Explicitly out of scope

- Exposing Hardcover tokens to client components.
- Replacing existing Open Library, Google Books, or ISBNdb providers.

---

## Thorough QA pass with removable demo catalog

### Goal

Seed a larger realistic catalog and test the app as a real user across catalog, book detail, loans, visual browsing, scan, settings, and core routes.

### Results

- Added `prisma/demoCatalog.ts` with 50 removable demo books using popular-book metadata shaped like Hardcover results.
- Added npm scripts:
  - `npm run demo:seed`
  - `npm run demo:clear`
- Demo books are tagged with `metadataSource = "demo-hardcover"` and can be removed without touching manually entered books.
- Seeded demo catalog after default house seed.
- Verified demo cleanup and reseed.
- Ran browser QA against the production server.
- Fixed a server-action redirect bug where successful book/loan actions could be caught and displayed as `NEXT_REDIRECT` errors.
- Fixed a scan-page autofill/accessibility issue by adding a `name` attribute to the manual ISBN input.

### Commands run

- `npm run db:push`
- `npm run db:seed`
- `npm run demo:seed`
- `npm run demo:clear`
- `npm run demo:seed`
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- route smoke checks for `/`, `/catalog`, `/books/new`, `/house/2d`, `/house/3d`, `/scan`, `/settings`, `/locations`, and `/loans`

### Results from validation

- Full test suite passed: 5 files passed, 1 skipped; 19 tests passed, 7 skipped.
- Lint passed.
- Typecheck passed.
- Build passed.
- Core routes returned HTTP 200.
- Final seeded state: 53 books, 50 demo books, 53 copies, 44 shelf slots, 1 active loan.
- Catalog search for `Dune` returned the correct demo book.
- Book detail displayed demo metadata and copy location correctly.
- Loan and return workflows worked after the redirect fix.
- Manual book creation worked and redirected to the new book detail page.
- 2D browser restored URL shelf/depth state and depth toggle updated URL state.
- 3D browser loaded, shelf selection updated the shared selected shelf panel, and no Blender file was required.
- Scan manual ISBN lookup returned Open Library metadata for `9780547928227`.
- Settings showed database connected and provider configuration status.

### Known issues

- Agent-browser CLI could not launch Chrome in this environment, even with `--no-sandbox`; built-in Chrome DevTools was used instead.
- A benign Three.js deprecation warning appeared during 3D QA: `THREE.Clock` is deprecated in favor of `THREE.Timer`.
- Live Hardcover API calls were not made because no `HARDCOVER_API_TOKEN` was provided; demo data is local and removable.

---

## Cover and metadata enrichment fix

### Goal

Ensure demo books have visible covers/details and future manual book creation attempts metadata and cover enrichment immediately.

### Results

- Added automatic best-effort metadata refresh after manual book creation, preserving user-entered fields through the existing merge rules.
- Added local cover caching and richer metadata backfill for demo catalog books.
- Added `npm run demo:enrich` for refreshing existing demo books without deleting/reseeding them.
- Updated `npm run demo:seed` so newly seeded demo books are enriched with metadata and local covers.
- Updated catalog cards to display cover images when available.
- Updated book detail pages to display page count, language, and categories in addition to cover, publisher, date, source, and description.

### Commands run

- `npm run demo:enrich`
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- route and cover smoke checks

### Results from validation

- Existing demo backfill completed: 50 demo books, 50 with covers, 50 cached cover image records.
- A sampled local cover route returned HTTP 200 with `image/jpeg`.
- Catalog search for `Dune` shows a cover image.
- Dune detail page shows cover, page count, language, category, source, and description.
- Full test suite passed: 5 files passed, 1 skipped; 19 tests passed, 7 skipped.
- Lint passed.
- Typecheck passed.
- Build passed.

### Known issues

- Automatic enrichment is best-effort because external providers may be unavailable or unconfigured.
- Live Hardcover enrichment still requires `HARDCOVER_API_TOKEN`; otherwise the Hardcover provider is skipped safely.

---

## Hardcover token-file integration

### Goal

Use the local Hardcover API token file for verification and live enrichment without printing or hardcoding the secret.

### Results

- Located the local token file at `cozy_home_library_blender_docs_v3/hardcoverapi.txt`.
- Added `cozy_home_library_blender_docs_v3/*api*.txt` to `.gitignore` so API token text files are not accidentally committed.
- Added `HARDCOVER_API_TOKEN_FILE` support alongside `HARDCOVER_API_TOKEN`.
- Verified the token against Hardcover's `me` query without printing the token.
- Verified the app's `lookupHardcover` provider with `9780547928227`; it returned `The Hobbit` with cover and description fields.
- Backfilled demo books through live metadata refresh with the token file configured.
- Restarted the server with `HARDCOVER_API_TOKEN_FILE` set.

### Commands run

- Hardcover `me` GraphQL verification request.
- `lookupHardcover({ isbn: "9780547928227" })` verification.
- Sequential demo metadata refresh for 50 demo books.
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Results from validation

- Live Hardcover token verification passed.
- Live app provider verification passed: provider `hardcover`, title `The Hobbit`, cover present, description present.
- Demo live backfill attempted 50 books: 50 refreshed, 0 failed.
- 30 demo books have direct Hardcover source/cache matches; all 50 demo books have provider metadata and covers through the combined provider flow.
- Full test suite passed: 5 files passed, 1 skipped; 19 tests passed, 7 skipped.
- Lint passed.
- Typecheck passed.
- Build passed without warnings after removing the implicit default token-file trace from production bundles.
- Server is running with `HARDCOVER_API_TOKEN_FILE` configured.

### Explicitly out of scope

- New 3D behavior
- Blender assets or GLB loading

---

## Stage 14: Generated 3D house browser

### Goal

Create a working React Three Fiber generated 3D house browser before Blender assets exist.

### Status

Completed.

### Results

- Installed `three`, `@react-three/fiber`, `@react-three/drei`, and `@types/three`.
- Built `/house/3d` as a generated React Three Fiber scene that does not require a Blender file.
- Added generated low-poly room/floor geometry for the default house areas and clickable shelf meshes.
- Shelf mesh names and `userData.sceneKey` values use database scene keys.
- Added shelf labels, OrbitControls, mobile-safe DPR defaults, shelf shortcut buttons, and a reset camera button.
- Added a reusable `SelectedShelfPanel` with shelf metadata, slot grid, copy counts, and book links.
- Added `getHouseBrowserData` service for plain server-to-client house browsing data.

### Commands run

- `npm install three @react-three/fiber @react-three/drei && npm install -D @types/three`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `docker compose up -d postgres`
- `npm run db:push`
- `npm run db:seed`
- `npm start`

### Results from validation

- Lint passed.
- Typecheck passed.
- Build passed.
- `/house/3d` returned HTTP 200 from the running server.

### Known issues

- The scene is intentionally generated placeholder geometry until the later Blender GLB stage.
- 2D house browsing was implemented afterward as an out-of-order Stage 13 catch-up and reuses the selected shelf panel.
- Prisma 6 still warns that `package.json#prisma` seed config is deprecated for Prisma 7.

### Next stage readiness

Stage 15 can safely begin.

### Explicitly out of scope

- Blender GLB loading
- Requiring a Blender file
- Modeling individual books in 3D
- Full 3D replacement for catalog management workflows
