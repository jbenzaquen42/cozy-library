# Manual Test Checklist

Use this checklist for closeout QA after major changes. Stage-specific exit checks remain recorded in `docs/current-stage.md`.

## Pre-1.0 closeout status (Stages 33–38)

### Automated checks

- [x] `npm run typecheck` passed.
- [x] `npm run lint` passed (0 errors, 0 warnings).
- [x] `npm run test` passed: 7 files, 59 tests passed, 10 skipped.
- [x] `npm run build` passed.
- [x] `npm audit --audit-level=high` passed with 0 vulnerabilities.
- [x] Docker Compose built and started successfully.

### Route smoke checks

- [x] `/` returned HTTP 200.
- [x] `/house/3d` returned HTTP 200.
- [x] `/catalog` returned HTTP 200.
- [x] `/settings` returned HTTP 200.
- [x] `/house/2d` returned HTTP 200.
- [x] `/scan` returned HTTP 200.
- [x] `/unshelved` returned HTTP 200.

### Living-room bookshelf browser (pre-1.0 polish)

- [x] First-visit onboarding card appears and dismisses persistently.
- [x] Help card explains shelf switching, peeking, opening, search, and moving books.
- [x] All visible copy uses cottage-core language: "Your bookcases", "Books waiting for a home", "Settle here", "Take a closer look", etc.
- [x] Book spines render with caps, page edges, gold-foil text, wood-grain shelves, and deterministic tilt.
- [x] `+N` overflow badge appears when a row has more books than the visible limit.
- [x] Selected book peek (`translate-y-4 scale-110 ring-4`) is obvious.
- [x] Detail panel opens with `book-draw` animation and closes with soft settle-down transform.
- [x] Mobile bottom-sheet shelf switcher works with close button and "Choose another bookcase" affordance.
- [x] All critical tap targets are 44 px or larger (tooltip dismiss, detail close, mobile close, form inputs).
- [x] Swipe navigation works on mobile with motion-safe hint for first visit.
- [x] Local `.wav` sounds play on book select, shelf switch, move, and close; ambient loop toggles independently.
- [x] Sound toggle, ambient toggle, volume, and reset are available from both the viewer popover and `/settings`.
- [x] Settings card on `/settings` clearly distinguishes local browser preferences from server/database status.
- [x] Keyboard navigation (arrows, Escape) still works.
- [x] No old 3D runtime dependency (Three.js, React Three Fiber, GLB) exists.

### Inventory integrity

- [x] Real inventory counts remain intact: 375 books, 376 copies, 372 shelved, 4 unshelved.
- [x] Shelf placement counts are plausible (Fawn 107, Hedgehog 98, Rabbit 60, Wren 47, Fox 60).

## Deferred post-1.0

- Import/export and backup/restore remain optional future work.
- PostgreSQL full-text/trigram search for libraries beyond the current scale.
- Optional decorative `living_room.blend`/GLB background (inventory stays database-owned).
- Agent-browser QA pass on 375px mobile viewport (Chrome sandbox unavailable in this environment; HTTP smoke + CSS audit pass).
