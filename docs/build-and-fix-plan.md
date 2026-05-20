# Build and Fix Plan

This plan turns the post-Stage-22 review findings into staged, runnable work. It intentionally ignores public-security concerns, but it does treat local data loss, unexpected database mutation, and user trust as product-quality issues.

## Completion status

Stages 23 through 28 are complete as of the Stage 28 closeout in `docs/current-stage.md`. The only remaining items from this plan are explicitly deferred unless the product direction changes: public auth/cloud sync, the old full-house 3D runtime, drag/drop visual placement, fully automatic shelf-photo catalogue import, and baking shelf inventory into Blender/GLB assets.

## Ground rules

- Keep the app runnable after every stage.
- Update `docs/current-stage.md` before starting and after finishing each stage.
- Do not reintroduce the old full-house React Three Fiber scene, visual drag/drop placement, or shelf-photo catalogue workflow.
- Keep the current Stage 19+ direction: database-backed catalog plus the app-rendered living-room bookshelf browser.
- Prefer simple, working fixes over broad rewrites.
- Preserve manual book entry as the reliable fallback when scans, OCR, or metadata providers fail.

## Baseline validation

The review baseline passed:

- `npm run lint`
- `npm run typecheck`
- `npm test` — 49 passed, 8 skipped
- `npm run build`

Each implementation stage below should at minimum rerun typecheck, lint, tests, and build unless a stage explicitly calls out extra Docker or database checks.

---

## Stage 23 — Runtime data-safety baseline

### Goal

Stop startup and seed tasks from unexpectedly changing or unshelving a real user's library. Make Docker startup migration-safe and make demo data opt-in.

### Why this comes first

A real user can tolerate a rough UI more than silent data changes. The current startup path runs schema push with data-loss acceptance and then runs seed logic that can prune shelf slots.

### Primary files

- `docker-entrypoint.sh`
- `docker-compose.yml`
- `.env.example`
- `prisma/seed.ts`
- `prisma/migrations/**`
- `lib/db/locations.ts`
- `README.md`
- `docs/current-stage.md`

### Work items

1. Replace container startup `npx prisma db push --accept-data-loss` with `npx prisma migrate deploy`.
2. Confirm fresh Docker startup still creates the schema through committed migrations.
3. Make default-house seeding non-destructive:
   - create missing default levels, rooms, shelves, and slots;
   - update safe labels, dimensions, and sort metadata only where appropriate;
   - never delete occupied slots during normal seed;
   - do not silently unshelve copies through slot deletion.
4. If destructive default-layout reconciliation is still needed, move it behind an explicit maintenance command with clear documentation.
5. Change Docker demo data defaults from `DEMO_CATALOG_MODE=ensure` to `DEMO_CATALOG_MODE=skip`.
6. Document explicit demo opt-in: `ensure`, `seed`, and `clear` modes.
7. Review `Dockerfile` copying of `lib/`; remove redundant copies if Next standalone output already contains required runtime modules.
8. Replace placeholder runtime values such as `APP_CONTACT_EMAIL=replace-me@example.com` with documented optional/local defaults.

### Acceptance criteria

- A fresh Docker Compose startup creates schema and default house successfully.
- Restarting an existing app does not add demo books unless requested.
- Normal seed does not delete occupied shelf slots.
- Existing copies remain shelved after startup and seed.
- README explains how to opt into and clear demo data.

### Validation

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `docker compose up --build -d`
- Smoke checks for `/`, `/house/3d`, `/settings`, and `/catalog`
- Database check before/after restart confirming copy shelf assignments are unchanged

---

## Stage 24 — Trustworthy user flows and destructive-action safeguards

### Goal

Make the app behave honestly from a real user's perspective: no dead-end placement promises, no accidental deletes, clearer feedback, and fewer placeholder surfaces in primary navigation.

### Primary files

- `app/unshelved/page.tsx`
- `app/books/[id]/page.tsx`
- `app/books/[id]/edit/page.tsx`
- `app/books/new/page.tsx`
- `app/locations/page.tsx`
- `app/loans/page.tsx`
- `app/import-export/page.tsx`
- `app/settings/page.tsx`
- `components/ui/button.tsx`
- `components/ui/empty-state.tsx`
- new small client components as needed for confirmations, pending submit buttons, and flash banners
- `docs/current-stage.md`

### Work items

1. Fix the unshelved queue:
   - change `Open room view` to a truthful action;
   - preferably link each copy to `/books/{bookId}` where the move form exists;
   - or add direct shelf assignment controls on the unshelved card.
2. Add confirmation for destructive actions:
   - delete copy;
   - delete bookshelf;
   - delete room;
   - delete level;
   - optionally return loan if mis-taps are common in testing.
3. Separate destructive copy actions from loan/move forms visually, especially on mobile.
4. Replace URL-persistent `?saved=1` / `?error=...` banners with dismissible flash behavior that removes handled query params from the URL.
5. Add submit-pending states for server-action forms using `useFormStatus` or a small reusable client submit button.
6. Standardize empty states with the existing `EmptyState` component and useful next actions.
7. Rename `Settings` to `Status` or `Diagnostics` until editable settings exist, or add real settings if that becomes the stage scope.
8. Add page-level loading/error handling for settings/status data so database/provider failures do not fall through to only the root error boundary.
9. Hide `Import/Export` from primary navigation until implemented, or make it visibly disabled/coming-soon rather than a normal nav destination.
10. Improve location admin usability:
   - collapse rooms/shelves by default;
   - group shelf dimension fields;
   - reduce nested inline form density;
   - make create/update/delete affordances visually distinct.
11. Standardize creation copy, for example `Add book manually`, `Add scanned book`, and `Move copy`.

### Acceptance criteria

- `/unshelved` no longer sends users to a placement dead end.
- Destructive data changes require intentional confirmation.
- Success/error messages can be dismissed and do not reappear after refresh.
- Slow submissions show visible pending feedback and prevent obvious double-submit mistakes.
- Primary navigation does not present unimplemented functionality as ready.

### Validation

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual browser pass for catalog, book detail, unshelved, locations, loans, settings/status, and import/export navigation

---

## Stage 25 — Accessibility, navigation, and visual polish

### Goal

Address high-impact accessibility and interaction polish so keyboard, screen-reader, mobile, and slow-network users have a reliable experience.

### Primary files

- `app/layout.tsx`
- `app/catalog/page.tsx`
- `app/books/[id]/page.tsx`
- `app/house/2d/page.tsx`
- `app/house/3d/page.tsx`
- `components/side-nav.tsx`
- `components/bottom-nav.tsx`
- `components/mobile-menu.tsx`
- `components/scan/ScanFlow.tsx`
- `components/scan/PhotoOcr.tsx`
- `components/house/House2DBrowser.tsx`
- `components/house/LivingRoomBookshelfBrowser.tsx`
- `components/ui/skeleton-page.tsx`
- `docs/current-stage.md`

### Work items

1. Add `aria-current="page"` to active links in side nav, bottom nav, and mobile menu.
2. Add a skip-to-content link in `app/layout.tsx` and make sure `main` has a stable target.
3. Add accessible labels to scan/manual ISBN inputs; do not rely on placeholders as labels.
4. Add visible keyboard focus styles to SVG shelf controls in the 2D map.
5. Make the 2D map honest about user-created shelves:
   - dynamically place custom shelves;
   - or add a fallback shelf list for unmapped shelves;
   - or clearly label the SVG as the default-house map only.
6. Fix the `Button` component behavior when `href` and `disabled` are both supplied:
   - either enforce this at the type level;
   - or render a disabled non-link element.
7. Replace plain `<a>` internal links in house browsers with Next `Link` where practical.
8. Ensure each page has one primary `<h1>`; demote nested browser headings as needed.
9. Improve cover image rendering:
   - use `next/image` where feasible;
   - otherwise add explicit dimensions and `loading="lazy"` to native images.
10. Add route-specific skeletons for dense pages such as catalog, locations, and book detail, or make the shared skeleton less mismatched.
11. Improve living-room dense-row overflow:
   - make `+N` interactive;
   - or add a tooltip/accessible label explaining that additional books are hidden.
12. Simplify awkward copy such as `Front depth` / `Back depth` to `Front` / `Back` if context is clear.
13. Review server-rendered locale-sensitive dates and use deterministic formatting or a client-side formatter where hydration/user-locale mismatch is likely.

### Acceptance criteria

- Keyboard users can see focus on every interactive map/nav element.
- Screen readers can identify active navigation and key form inputs.
- Internal navigation avoids unnecessary full page reloads.
- Cover loading does not cause obvious catalog/book-detail layout shift.
- Dense shelf overflow is understandable and not a dead-looking badge.

### Validation

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual keyboard-only pass for nav, scan, 2D house map, 3D/living-room browser, book detail, and locations

---

## Stage 26 — API and server-boundary cleanup

### Goal

Reduce duplicated API surfaces, keep server-only code behind service modules, and remove stale endpoints from superseded workflows.

### Primary files

- `lib/api/root.ts`
- `lib/api/client.ts`
- `lib/api/routers/**`
- `lib/files/importExport.ts`
- `lib/db/**`
- `app/books/actions.ts`
- `app/locations/actions.ts`
- `app/loans/actions.ts`
- `app/scan/actions.ts`
- `app/api/scan-ocr/route.ts`
- `components/scan/ScanFlow.tsx`
- `components/scan/PhotoOcr.tsx`
- `app/shelf-photos/[...path]/route.ts`
- `docs/technical-architecture.md`
- `docs/remaining-project-guide.md`
- `docs/current-stage.md`

### Work items

1. Decide the primary UI boundary:
   - recommended near-term default: server components + server actions + shared service modules;
   - keep tRPC only where it provides active value.
2. Stop manually constructing and parsing tRPC URLs in `ScanFlow`:
   - either use a typed tRPC client;
   - or replace the call with a simpler route/service action consistent with the chosen boundary.
3. Remove unused tRPC routers/client code, or document why each remaining router exists.
4. Fix `lib/api/routers/importExport.ts` so validated input is either passed to `previewCsvImport` or the placeholder route is removed until import/export is implemented.
5. Move OCR implementation and `OcrResult` from `app/scan/actions.ts` into a shared server module such as `lib/scan/ocr.ts`.
6. Make `app/api/scan-ocr/route.ts` and `app/scan/actions.ts` thin adapters around that shared OCR service.
7. Remove or quarantine the inactive `app/shelf-photos/[...path]/route.ts` unless retained as documented compatibility-only behavior.
8. Remove or document the unused `copy.unshelved` tRPC query.
9. Update technical architecture docs to match the actual chosen API boundary.

### Acceptance criteria

- Client components do not import server-action implementation files just for types.
- No manual parsing of tRPC internals remains in client code.
- Import/export backend is either honestly deferred or actually passes validated input through.
- Superseded shelf-photo/visual-placement endpoints are not active by accident.
- Architecture docs describe the actual app structure.

### Validation

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual scan/OCR/metadata lookup smoke pass if the stage touches scan code

---

## Stage 27 — Service correctness and regression hardening

### Goal

Fix quieter correctness issues in service code and add tests so future stages do not regress data behavior.

### Primary files

- `lib/db/locations.ts`
- `lib/db/books.ts`
- `lib/db/metadata.ts`
- `lib/db/houseBrowser.ts`
- `lib/metadata/merge.ts`
- `lib/scene/livingRoomBrowser.ts`
- `lib/scene/defaultSceneKeys.ts`
- `lib/validation/book.ts`
- `lib/validation/metadata.ts`
- `tests/unit/services.test.ts`
- `tests/unit/metadata.test.ts`
- `tests/unit/livingRoomBrowser.test.ts`
- possible new integration tests under `tests/**`
- `docs/current-stage.md`

### Work items

1. Make `listLocations({ includeSlots })` honor `includeSlots` instead of discarding it.
2. Replace unsafe generic reorder casting in `reorderWithinScope` with clearer model-specific helpers or a type-safe abstraction.
3. Ensure metadata refresh keeps `Book.displayAuthor` and `BookAuthor` join rows in sync if author data changes.
4. Decide and test orphan `Author` cleanup behavior after book deletion or author replacement.
5. Reduce unsafe Prisma casts such as `merged.patch as Prisma.BookUpdateInput` by tightening patch types.
6. Normalize optional text consistently across validation and service layers, especially ISBN fields.
7. Improve `pageCount` validation so bad user input gets a clear error.
8. Decide whether `countSlots` should expose zero-dimension data as zero/error instead of masking it with `Math.max(1, ...)`.
9. Fix `HouseBrowserCopy` type drift by selecting/mapping ISBN fields or removing them from the view type.
10. Use exact scene-key constants for default active shelf selection instead of substring matching.
11. Update stale DB-backed test expectations for the current default slot count.
12. Make tests that mutate `process.env` isolate and restore environment state safely.
13. Remove Windows-specific test assumptions such as hardcoded `D:/...` missing-token paths.
14. Add regression coverage for seed safety around occupied slots.
15. Add a documented integration-test path that runs DB-backed tests against Compose Postgres.
16. Add first Playwright E2E tests for the most important real-user paths:
    - app loads;
    - add manual book;
    - move copy to shelf;
    - view shelf in living-room browser;
    - loan and return copy.

### Acceptance criteria

- Service functions do what their signatures claim.
- Metadata writes cannot quietly desync author display and author joins.
- Tests cover current default layout assumptions.
- DB-backed tests can be run intentionally and are documented.
- At least one critical E2E path exists if Playwright remains in the project.

### Validation

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `docker compose up -d postgres` plus the documented DB/integration test command
- `npm run test:e2e` if E2E tests are added in this stage

---

## Stage 28 — Catalog scale, import/export, and release cleanup

### Goal

Clean lower-risk maintenance issues and prepare the app for larger real libraries and more reproducible releases.

### Primary files

- `package.json`
- `package-lock.json`
- `app/catalog/page.tsx`
- `lib/search/catalog.ts`
- `app/import-export/page.tsx`
- `lib/files/importExport.ts`
- `lib/api/routers/importExport.ts` if retained
- `Dockerfile`
- `README.md`
- `docs/technical-architecture.md`
- `docs/remaining-project-guide.md`
- `docs/current-stage.md`

### Work items

1. Pin concrete dependency versions instead of broad `latest` ranges.
2. Decide the catalog scaling strategy:
   - keep in-memory search for small libraries and document expected limits;
   - or move coarse filtering/search into Prisma/Postgres and keep JS only for ranking polish.
3. Add catalog pagination or a `Load more` pattern before the app is expected to handle hundreds/thousands of books.
4. Either implement import/export backup flows or keep the page/API hidden and explicitly deferred.
5. If import/export is implemented, prioritize recoverability:
   - export books/copies/locations/loans;
   - preview import changes;
   - avoid destructive import by default;
   - document backup/restore steps.
6. Revisit Prisma seed deprecation warning and move seed configuration out of `package.json#prisma` when Prisma 7 compatibility becomes necessary.
7. Document known limits and operational expectations for local/Docker usage.

### Acceptance criteria

- Dependency installation is reproducible.
- Catalog performance strategy is explicit and tested for the intended library size.
- Import/export is either usable or no longer presented as ready.
- Release/runtime docs match the actual Docker and local workflows.

### Validation

- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `docker compose up --build -d`
- Smoke checks for core pages

---

## Suggested execution order

1. **Stage 23** — data safety first.
2. **Stage 24** — remove misleading flows and accidental-delete risks.
3. **Stage 25** — accessibility and visual polish.
4. **Stage 26** — API/server-boundary cleanup.
5. **Stage 27** — service correctness and regression tests.
6. **Stage 28** — scale, import/export, and release cleanup.

Stages 24 and 25 are closely related, but keep them separate so trust-breaking flow fixes can land before broader polish.

## Deferred unless direction changes

- Public authentication or multi-user authorization.
- Cloud sync.
- Rebuilding the old full-house 3D navigation runtime.
- Drag/drop visual book placement.
- Fully automatic shelf-photo catalogue import without manual review.
- Baking final shelf inventory into Blender or a GLB asset.
