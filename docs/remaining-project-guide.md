# Remaining Project Guide

This guide reflects the active direction after the Stage 19 pivot and the Stage 23-28 remediation pass. The old full-house React Three Fiber, Blender GLB, layout/edit-mode, visual book-moving, and shelf-photo catalogue plans are no longer active.

## Current baseline through Stage 28

- Private/local Next.js App Router app with PostgreSQL, Prisma, Zod, Tailwind, Docker Compose, and DockerHub image support.
- Manual catalog, copies, locations, loans, search/filtering, barcode scan, OCR, metadata lookup, cover caching, and settings/status pages.
- 2D house browser remains available at `/house/2d`.
- Primary visual browser is `components/house/LivingRoomBookshelfBrowser.tsx` on `/` and `/house/3d`.
- The living-room browser shows one straight-on room view and moves/switches the active bookshelf into the center position with on-screen and keyboard arrows.
- Default physical shelves are: first-floor entry shelf with 5 rows, three upstairs hallway bookcases with 3 rows each, and study shelf with 4 rows.
- Demo catalog is removable through `DEMO_CATALOG_MODE` and `npm run demo:*` scripts.
- Production startup applies committed Prisma migrations instead of pushing schemas, and default-house seeding preserves occupied shelf slots.
- Catalog results use a small-library JavaScript ranking strategy with `Load more` rendering; PostgreSQL full-text/trigram search remains the path for much larger libraries.
- Import/export backup tooling is explicitly deferred and hidden from primary navigation; use database backups until app-level preview/restore flows are added.
- Current DockerHub image tags: `jbenzaquen/cozy-library:latest`, `jbenzaquen/cozy-library:stage22-regression`, `jbenzaquen/cozy-library:stage21-polish`, `jbenzaquen/cozy-library:stage20-living-room`, and `jbenzaquen/cozy-library:nas-house-test`.

## Product direction

The app stays private and local. Security work should focus on not leaking secrets and not corrupting local data, not public-user auth. Manual entry must always work when external providers fail.

The active visual direction is a simple room-focused bookshelf browser:

1. Scan, import, or manually enter books.
2. Enrich metadata automatically when possible.
3. Cache covers and metadata locally.
4. Browse shelves from the straight-on living-room view.
5. Switch the active bookshelf with arrows or the right-side shelf switcher.
6. Open individual books from rendered book spines.
7. Keep all shelf/book state in the database.
8. Export/import backups so the library is recoverable.

## Non-negotiable architecture rules

- The database is the source of truth for books, copies, locations, shelf slots, metadata, and loans.
- Scene keys are stable identifiers. Display names can change; scene keys should not drift.
- The living-room browser is app-rendered and must not depend on a GLB asset to run.
- Any future `living_room.blend`/GLB work is decorative context only; final shelf inventory remains app/database generated.
- User-entered fields beat provider metadata during merges.
- API keys are entered by the user or passed through local env/token files; they are not committed, bundled, or printed.

## Reconciled stages 16-22

### Stage 16 — Physical shelf set reconciliation

Old plan: full-house modular 3D placement/edit controls.

Active result: disregard the edit-mode UI. Keep only the database-backed shelf records and row/depth counts needed for the real shelves. The seed now reconciles the active physical shelf set and prunes obsolete extra slots when row/depth counts shrink.

### Stage 17 — Living-room bookshelf browser

Old plan: shelf close-up camera, 3D book meshes, sound, and orbit controls.

Active result: replace this with the straight-on `LivingRoomBookshelfBrowser`. It renders rows and clickable book spines with HTML/CSS, supports reduced-motion-safe transitions, and keeps the selected bookshelf context on screen.

### Stage 18 — Moving active bookshelves, not visual book placement

Old plan: drag/drop book moving, unshelved queue placement, and photo shelf catalogue.

Active result: disregard visual book-moving/photo workflows for now. The movement in scope is bookshelf switching: arrows and the right-side overlay move each existing bookshelf into the center living-room position. Copy movement remains available through ordinary book/location forms and services.

### Stage 19 — Main-screen pivot

Completed: `/` and `/house/3d` now use the living-room bookshelf browser. The old full-house GLB asset was removed and no `living_room.blend` asset is required for the app to run.

### Stage 20 — Local runtime and DockerHub publish

Completed: local npm and Docker Compose startup paths were validated, docs were updated, and DockerHub images were pushed.

### Stage 21 — Living-room usability and quality pass

Completed: the living-room browser received responsive, accessibility, dense-shelf, and visual polish without reintroducing the old full-house runtime.

### Stage 22 — Regression hardening

Completed: living-room browser data shaping was extracted into a shared helper and covered by unit tests for shelf ordering, friendly names, occupancy, dense-row clipping, and bounded active shelf indexes.

## Optional future build order

The active remediation plan in `docs/build-and-fix-plan.md` has been completed through Stage 28:

1. Runtime data-safety baseline.
2. Trustworthy user flows and destructive-action safeguards.
3. Accessibility, navigation, and visual polish.
4. API and server-boundary cleanup.
5. Service correctness and regression hardening.
6. Catalog scale, import/export, and release cleanup.

Optional feature work can resume:

1. Add book-level details or quick actions from the room browser only if they stay simple.
2. Add new bookshelf creation later, after the current physical shelves are stable.
3. Finish deeper metadata key settings and scan/import enrichment.
4. Implement non-destructive export/import backup previews when recoverability becomes the next priority.

## Do not do unless direction changes

- Rebuild the old full-house React Three Fiber scene.
- Add 3D orbit/transform controls for shelves.
- Bring back browser-local test bookcases.
- Add drag/drop visual book placement before the room browser is stable.
- Public authentication/authorization.
- Cloud sync.
- Social reading features.
- Fully automatic AI spine recognition without a manual review/confirmation path.
- Baking final shelf inventory into Blender.
