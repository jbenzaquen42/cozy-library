# Manual Test Checklist

Use this checklist for closeout QA after major changes. Stage-specific exit checks remain recorded in `docs/current-stage.md`.

## Stage 28 closeout status

- [x] `npm audit --audit-level=moderate` passed during Stage 28 closeout validation.
- [x] `npm run lint` passed during Stage 28 closeout validation.
- [x] `npm run typecheck` passed during Stage 28 closeout validation.
- [x] `npm run test` passed during Stage 28 closeout validation.
- [x] `npm run build` passed during Stage 28 closeout validation.
- [x] Docker Compose rebuilt successfully and smoke checks for `/`, `/catalog`, `/catalog?page=2`, `/import-export`, `/house/3d`, and `/settings` returned HTTP 200 during Stage 28 closeout validation.
- [x] The README labels the recorded DockerHub digest as the last Stage 22 publish. A Stage 28 DockerHub publish remains an explicit release action, not an assumed local-build side effect.

## Completed product surfaces

- [x] Startup and settings pages are implemented with database/app-data/provider-key status checks.
- [x] Catalog search and filters are implemented for title, author, ISBN, availability, level, room, bookshelf, row, and depth.
- [x] Catalog results render through a 24-book `Load more` pattern, with documented small-library limits and a PostgreSQL search path for much larger libraries.
- [x] Manual book creation/editing is implemented with validation and metadata-preserving merge behavior.
- [x] Copy creation, labeling, relocation, and occupied shelf/slot protections are implemented.
- [x] Loans can be created, blocked for unavailable copies, returned, and reviewed in history.
- [x] Metadata lookup, cover caching, barcode scanning, OCR upload, and manual fallback flows are implemented.
- [x] The 2D house browser remains available at `/house/2d` with stable scene-key navigation.
- [x] `/` and `/house/3d` use the app-rendered living-room bookshelf browser without requiring an old full-house GLB.
- [x] Living-room shelf switching works through on-screen arrows, keyboard arrows, and the right-side shelf switcher.
- [x] Living-room browser regression tests cover shelf order, default/friendly names, occupancy, dense-row clipping, and bounded active shelf indexes.
- [x] Docker/NAS startup, persistence, demo catalog modes, and token-file/env provider configuration are documented and validated for the published image.
- [x] Production startup uses committed Prisma migrations and non-destructive default-house seeding.
- [x] Dependencies are pinned to concrete versions and Prisma seed configuration lives in `prisma.config.ts`.

## Deferred outside the completed stages

- Import/export and backup/restore remain optional future work; the direct page says this explicitly and the backend intentionally reports `NOT_IMPLEMENTED`.
- Broader offline testing remains optional future hardening beyond the Stage 28 closeout smoke checks.
