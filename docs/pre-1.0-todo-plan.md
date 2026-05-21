# Pre-1.0 Todo Completion Plan

This plan reconciles `import/todo.md` with the current Stage 32 baseline. It is written as a handoff for another agent to finish the remaining pre-1.0 work confidently.

## Current baseline

- Current project state: Stage 32 completed in `docs/current-stage.md`.
- Primary surface: `components/house/LivingRoomBookshelfBrowser.tsx` rendered on `/` and `/house/3d`.
- Real inventory import is complete: 375 books, 376 copies, shelf placement, copy positions, and spine colors are in the local database.
- The old full-house React Three Fiber / GLB runtime was intentionally removed. Do not reintroduce it for 1.0 unless the product direction explicitly changes.
- Active visual direction: app-rendered cozy living-room bookshelf browser, with database-backed books, copies, shelves, colors, and locations.

## Design direction for the final sprint

Use the `interface-design` and `frontend-design` skills for any implementation work touching the viewer, catalog, settings, or onboarding.

**Domain concepts:** home library, reading nook, bookcase, shelf tag, tucked-away books, tea/coffee, handwritten labels, cottage woodwork, quiet fireplace/rain ambience.

**Color world:** parchment, cream, walnut, honey oak, sage, faded rose, brass/gold-foil highlights, muted book-cloth colors, soft window blue.

**Signature:** the living-room shelf should feel like a physical bookcase: book spines have caps/edges/print texture; shelf wood has grain; selected books peek out before opening.

**Defaults to avoid:**

- Generic dashboard language like “viewer”, “queue”, “flow”, or “helper”.
- Flat CSS rectangles that read like a chart instead of books.
- Desktop-first drag/drop with tiny mobile fallback buttons.
- Synthetic beeps presented as “cozy” sound.

## Audit of `import/todo.md`

| # | Todo summary | Current status | Evidence | Pre-1.0 decision |
|---|---|---|---|---|
| 1 | Books display title/author and scale reasonably | Implemented, needs visual polish | `BookSpine` shows title and author and varies height/width in `components/house/LivingRoomBookshelfBrowser.tsx`. | Keep; improve spine realism/readability. |
| 2 | First click shows tooltip with larger title/author | Implemented | `chooseBook` sets `selectedCopyId`; `BookTooltip` renders larger title/author. | Keep; polish copy and mobile selection affordance. |
| 3 | Second click opens main book info | Implemented | Second click sets `detailCopyId`; `BookDetailPanel` opens inline. | Keep; consider smoother close-to-shelf return animation. |
| 4 | Red X closes and puts book back animated | Mostly implemented | Red X exists; book transform returns via CSS transition. | Add a more intentional close/return animation if time permits. |
| 5 | Full pull-out opening animation | Implemented | `book-draw` keyframes in `app/globals.css`; detail panel uses the animation. | Keep; respect `prefers-reduced-motion`. |
| 6 | Shelf names editable from shelf edit button | Implemented | `Edit shelf` opens `ShelfEditForm`; save action persists changes. | Keep; improve edit form preview and language. |
| 7 | First click makes book come half out/down | Implemented, subtle | Selected spine uses `translate-y-3 scale-105`. | Make selected “peek” clearer on mobile and reduced-motion-safe. |
| 8 | Shelf edit changes color/count/width/height/name | Implemented | Shelf edit form has name, row count, width units/meters, height meters, frame/shelf/trim colors. | Keep; add live preview or clearer grouping if doing polish. |
| 9 | House position shown next to shelf name | Implemented | Active shelf and switcher show `({locationLabel})`. | Keep. |
| 10 | All shelves viewer | Implemented | Right shelf switcher and arrows cover all shelves. | Rename away from “viewer”; make mobile switcher less cramped. |
| 11 | Edit/move books with drag and drop | Implemented | Book spines are draggable; shelf rows and unplaced area accept drops; tap-to-move exists. | Harden mobile touch targets and instructions. |
| 12 | Search tells where book is | Implemented | In-view search returns shelf/location/row/position and jumps to match; catalog search exists. | Keep; make results visually match book/shelf metaphor. |
| 13 | Cozy cottage-core music/sounds | Partially implemented | Web Audio procedural tones and local viewer settings exist. | Replace with local soft samples; keep oscillator as fallback. |
| 14 | Settings menu | Partially implemented | Viewer popover settings exist; `/settings` is status-focused. | Unify viewer ambience settings with `/settings`. |
| 15 | Optimized for mobile | Mostly implemented | Responsive shell, bottom nav, swipe navigation, touch controls. | Do a final 375px mobile pass; enforce 44px+ tap targets. |
| 16 | More aesthetically pleasing/cute cottage core | Mostly implemented | Cozy palette, fonts, room background, shelf browser. | Final visual hardening pass on books/shelf/room. |
| 17 | Remove AI-sounding helpers | Mostly implemented | No explicit AI helper language found. | Do final visible-string audit; remove technical words. |
| 18 | Easier for new users | Partially implemented | Empty states and inline instructions exist. | Add first-run/onboarding guidance and a simple help affordance. |
| 19 | Better book and shelf models | Partially implemented | App-rendered spines/shelves are improved, but there are no real 3D models. | For 1.0, improve app-rendered book/shelf models; do not rebuild old 3D runtime. |

## Pre-1.0 definition of done

Before 1.0, all `import/todo.md` items should be true from a user perspective:

1. The home shelf browser feels like the main product, not a prototype.
2. A first-time user can understand how to browse, search, open, and move books without reading documentation.
3. A mobile user can browse shelves and move a book with thumbs only on a 375px-wide screen.
4. Book and shelf visuals look intentionally like physical cottage-core objects, not flat data blocks.
5. Sounds are optional, pleasant, and locally hosted; no autoplay or external audio dependency.
6. Settings for ambience are discoverable from both the shelf browser and `/settings`.
7. User-facing copy is warm, clear, and non-technical.
8. The app still builds, tests, and runs without Three.js, React Three Fiber, GLB files, or old full-house navigation.

## Recommended build order

### Stage 33 — Copy, onboarding, and first-use clarity

**Goal:** Make the app understandable and remove remaining generic/technical language.

**Primary files:**

- `components/house/LivingRoomBookshelfBrowser.tsx`
- `app/page.tsx`
- `app/catalog/page.tsx`
- `app/settings/page.tsx`
- `app/house/2d/page.tsx` if linked/help copy changes are needed
- `docs/current-stage.md`

**Tasks:**

- Add a dismissible first-visit note in the living-room browser. Store dismissal in `localStorage`.
- Explain the interaction model in one warm sentence: switch bookcases with arrows, tap once to peek, tap again to open, search to find where a book lives.
- Add a small `?`/help affordance or inline “How this shelf works” card.
- Replace technical labels:
  - `All shelves viewer` -> `Your bookcases`
  - `Unplaced queue` -> `Books waiting for a home`
  - `Move here` -> `Settle here`
  - `Open info` -> `Take a closer look`
  - `Full page` -> `Open book page`
  - avoid `viewer`, `queue`, `flow`, `helper`, and implementation-language copy in visible UI.
- Keep copy accurate: do not imply AI automation or backup/import features that are not present.

**Acceptance criteria:**

- A new user sees useful guidance on the shelf page within 2 seconds.
- Visible copy reads naturally to a non-technical user.
- No primary UI string uses “viewer”, “queue”, “flow”, or “helper”.
- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass.

### Stage 34 — Mobile and touch hardening

**Goal:** Make browsing and moving books reliable on small touch screens.

**Primary files:**

- `components/house/LivingRoomBookshelfBrowser.tsx`
- `app/globals.css`
- possibly small new client components under `components/house/`
- `docs/current-stage.md`

**Tasks:**

- Ensure important touch targets are at least 44px by 44px on mobile.
- Make book spines easier to tap on small screens. If necessary, use wider mobile-only spine widths while preserving desktop density.
- Make shelf switching on mobile a bottom sheet, collapsible panel, or compact floating control so the active shelf stays central.
- Improve tap-to-move affordance:
  - selected book state should be obvious;
  - destination buttons should be readable and large;
  - success/error status should be close to the action.
- Add a first-use swipe hint on mobile, respecting reduced motion.
- Verify keyboard tab order remains logical.

**Acceptance criteria:**

- A user can move a book from one row/shelf to another on a 375px viewport without drag/drop.
- No critical action relies on hover.
- No important mobile tap target is below 44px.
- Swipe hint does not loop forever and is hidden/disabled for reduced-motion users.
- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass.

### Stage 35 — Book and shelf visual model upgrade

**Goal:** Finish TODO #19 within the active app-rendered living-room direction.

**Primary files:**

- `components/house/LivingRoomBookshelfBrowser.tsx`
- `app/globals.css`
- `lib/scene/livingRoomBrowser.ts` and tests if row/spine presentation helpers are extracted
- `tests/unit/livingRoomBrowser.test.ts` if helper logic changes
- `docs/current-stage.md`

**Tasks:**

- Upgrade book spines:
  - top/bottom cap lines;
  - subtle title emboss/gold-foil highlight;
  - deterministic tiny rotation/tilt based on copy ID;
  - page-edge sliver for visual depth;
  - better title/author readability at small sizes.
- Upgrade shelves:
  - wood-grain texture via CSS gradients or tiny inline SVG pattern;
  - clearer shelf boards and shadows;
  - color preview if shelf edit is open.
- Upgrade room background:
  - ground the scene with a window, rug, plant, lamp, or other CSS-only cottage details;
  - keep performance simple and avoid external model dependencies.
- Improve selected/open animations:
  - selected book should visibly peek out;
  - closing detail should feel like the book settles back;
  - all motion must respect `prefers-reduced-motion`.

**Acceptance criteria:**

- A row of books no longer reads as plain flat rectangles.
- Shelf wood and room details reinforce the cottage-core direction without hurting readability.
- Reduced-motion mode keeps all functionality and avoids distracting transforms.
- No Three.js, React Three Fiber, GLB dependency, or Blender asset is added.
- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass.

### Stage 36 — Sounds and ambience

**Goal:** Make TODO #13 feel genuinely cozy while preserving privacy/offline use.

**Primary files:**

- `components/house/LivingRoomBookshelfBrowser.tsx` or a new `components/house/useCozySounds.ts`
- `public/sounds/**`
- `README.md` if sound asset attribution/licensing needs documentation
- `docs/current-stage.md`

**Tasks:**

- Add short local audio samples:
  - book select: paper rustle or soft book thump;
  - shelf switch: quiet wooden slide/page turn;
  - close: soft book-settle sound;
  - optional ambient loop: fireplace/rain/window room tone.
- Only use permissively licensed or self-created sounds. Document source/attribution if required.
- Keep total sound payload small; target under 2 MB for ambience and effects combined.
- Preserve the current Web Audio oscillator as fallback if sample playback fails.
- Ensure sounds only play after explicit user interaction and never autoplay.

**Acceptance criteria:**

- Sound toggle and ambient toggle still default safe/off or non-intrusive.
- Sounds work offline from local `public/sounds/` assets.
- No external audio request is made at runtime.
- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass.

### Stage 37 — Settings cohesion

**Goal:** Make TODO #14 feel complete instead of split between a shelf popover and a status page.

**Primary files:**

- `app/settings/page.tsx`
- `components/house/LivingRoomBookshelfBrowser.tsx`
- possibly new shared settings component under `components/settings/` or `components/house/`
- `docs/current-stage.md`

**Tasks:**

- Show cozy viewer settings on `/settings` using the same `localStorage` key as the viewer popover.
- Keep the viewer popover as quick access, but make `/settings` the discoverable place for ambience preferences.
- Add `Reset viewer preferences`.
- Consider adding a clear, honest demo-catalog section if it can be implemented safely without pretending env-var-only Docker behavior is a live toggle. If implementing demo controls is too risky, document it as post-1.0.

**Acceptance criteria:**

- A user can discover sound/ambient/volume controls from `/settings`.
- Changing settings from either surface is reflected in the other after refresh, and immediately where practical.
- Settings copy clearly distinguishes local browser preferences from server/database status.
- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass.

### Stage 38 — 1.0 release verification and documentation

**Goal:** Freeze the pre-1.0 todo list, validate the app, and document the release state.

**Primary files:**

- `docs/current-stage.md`
- `docs/remaining-project-guide.md`
- `docs/manual-test-checklist.md`
- `README.md`
- optionally this file, marking plan items done

**Tasks:**

- Update `docs/current-stage.md` before and after the stage per `AGENTS.md`.
- Re-audit `import/todo.md` and mark each item satisfied or explicitly scoped.
- Run automated checks:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `npm audit --audit-level=high`
- Run manual browser checks on desktop and 375px mobile viewport:
  - `/`
  - `/house/3d`
  - `/catalog`
  - a sample `/books/[id]`
  - `/scan`
  - `/settings`
  - `/house/2d`
- Verify real inventory remains intact:
  - book/copy counts still align with Stage 32 expectations unless intentionally changed;
  - shelf placement counts are plausible;
  - unplaced books remain visible.
- If requested, build/push 1.0 Docker images and record digest.

**Acceptance criteria:**

- Every `import/todo.md` item is implemented from the active app-rendered living-room perspective.
- No old 3D runtime dependency has returned.
- Manual desktop/mobile smoke pass succeeds.
- Docs tell the next agent/user what is complete and what is post-1.0.

## Suggested validation commands

For feature stages:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

For final release hardening:

```bash
npm audit --audit-level=high
docker compose up --build -d
```

Then smoke-check core routes once the app is serving.

## Risks and guardrails

- Do not commit files under `import/`; the inventory folder is intentionally ignored.
- Do not print or hardcode provider API tokens.
- Keep server-only code out of client components.
- Keep scene keys stable; shelf names can change, scene keys should not drift.
- Do not add database models unless a stage explicitly calls for it and migrations/tests are included.
- Avoid large audio assets. Local sounds are fine; copyrighted music is not.
- Preserve manual add/edit/search when metadata providers fail.
- Do not promise app-level import/export backup unless it is actually implemented and tested.

## Post-1.0 candidates, not required for this todo list

- App-level export/import backup and restore preview.
- PostgreSQL full-text/trigram search if the library grows beyond the current private-home scale.
- Optional decorative `living_room.blend`/GLB background that does not own inventory state.
- Deeper metadata provider settings.
- Shelf-photo recognition with manual review.
