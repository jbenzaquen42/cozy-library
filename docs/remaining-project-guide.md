# Remaining Project Guide

This guide reflects the 1.0 release baseline after completing stages 33–38 from `docs/pre-1.0-todo-plan.md`. The old full-house React Three Fiber, Blender GLB, layout/edit-mode, visual book-moving, and shelf-photo catalogue plans are no longer active.

## 1.0 baseline

- Private/local Next.js App Router app with PostgreSQL, Prisma, Zod, Tailwind, Docker Compose, and DockerHub image support.
- Real inventory imported: 375 books, 376 copies across 5 bookshelves, with shelf positions and spine colors.
- Manual catalog, copies, locations, loans, search/filtering, barcode scan, OCR, metadata lookup (Open Library, Google Books, ISBNdb, Hardcover), and cover caching.
- 2D house browser available at `/house/2d`.
- Primary visual browser is `components/house/LivingRoomBookshelfBrowser.tsx` on `/` and `/house/3d`.
- App-rendered cozy bookshelf browser with cottage-core visual polish, local sounds, unified settings, mobile/touch hardening, and first-visit onboarding.
- Default physical shelves: Hedgehog Shelf (first-floor entry, 5 rows), Rabbit/Wren/Fox Shelves (upstairs hallway, 3 rows each), Fawn Shelf (reading room, 4 rows).
- Demo catalog is opt-in through `DEMO_CATALOG=true`; advanced cleanup/reseed modes remain available through `DEMO_CATALOG_MODE` and `npm run demo:*` scripts.
- Production startup applies committed Prisma migrations; default-house seeding preserves occupied shelf slots.
- Catalog uses small-library JavaScript ranking with `Load more` rendering (24 books/page).
- App-level import/export backup UI is explicitly deferred and hidden from primary navigation; CSV import/export is available through CLI scripts.
- Current DockerHub image tags: `jbenzaquen/cozy-library:latest`, `jbenzaquen/cozy-library:main`.

## All import/todo.md items satisfied

Every item in `import/todo.md` is implemented from the active app-rendered living-room perspective. See `docs/pre-1.0-todo-plan.md` for the per-item audit.

## Non-negotiable architecture rules

- The database is the source of truth for books, copies, locations, shelf slots, metadata, and loans.
- Scene keys are stable identifiers. Display names can change; scene keys should not drift.
- The living-room browser is app-rendered and must not depend on a GLB asset to run.
- Any future `living_room.blend`/GLB work is decorative context only; final shelf inventory remains app/database generated.
- User-entered fields beat provider metadata during merges.
- API keys are entered by the user or passed through local env/token files; they are not committed, bundled, or printed.

## Post-1.0 candidates

Not required for 1.0; can be added later when the product direction calls for them:

- App-level export/import backup and restore preview.
- PostgreSQL full-text/trigram search if the library grows beyond the current private-home scale.
- Optional decorative `living_room.blend`/GLB background (inventory stays database-owned).
- Deeper metadata provider settings.
- Shelf-photo recognition with manual review.
- New bookshelf creation through the living-room UI (currently managed in `/locations`).

## Do not do unless direction changes

- Rebuild the old full-house React Three Fiber scene.
- Add 3D orbit/transform controls for shelves.
- Bring back browser-local test bookcases.
- Public authentication/authorization.
- Cloud sync.
- Social reading features.
- Fully automatic AI spine recognition without a manual review/confirmation path.
- Baking final shelf inventory into Blender.
