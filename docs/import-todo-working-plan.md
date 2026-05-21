# Import Todo Working Plan

This plan converts `import/todo.md` into an implementation handoff. It assumes the current app direction remains the app-rendered cozy living-room bookshelf browser, with stable scene keys and database-backed books/copies/shelf slots.

## Baseline from `import/todo.md`

| Todo | Theme | Current read | Plan outcome |
|---|---|---|---|
| 1 | Shelf edit button: color, count, width/height, name | Mostly present in the viewer, needs clearer UI/state and maybe stronger visual affordance. | Polish shelf editing and make saved changes obvious. |
| 2 | Locations tab is confusing | `/locations` is admin-oriented and likely too technical. | Redesign information architecture/copy for location management. |
| 3 | Export does not need to be CSV; is another method better? | CSV CLI exists, app page still says import/export is not ready. | Use a versioned JSON backup package as the primary app export; keep CSV as optional/interoperability. |
| 4 | Export should include home configuration, numbered slots, books, colors, ISBN, positions, sizes | Not available in app UI. | Define and implement a complete backup schema. |
| 5 | Import function missing | App import is missing; CSV CLI exists. | Add app-level import preview and restore flow for the export format. |
| 6 | Import must work with whatever export creates | Needs a strict round-trip contract. | Add export/import round-trip tests and schema versioning. |
| 7 | Optional metadata export toggle | Not available in app UI. | Add a pre-export switch for including metadata. |
| 8 | Book names unreadable; shelves bigger; font scales; use vision models to check | Viewer already has visual work, but needs targeted readability validation. | Run a focused shelf readability/responsive pass with visual review. |
| 9 | All shelves viewer | Current viewer switches shelves one at a time. | Add an all-bookcases overview mode with jump/edit affordances. |
| 10 | Edit button with dragging/dropping moving books | Moving exists, but should be made explicit as an edit mode. | Add a clear move/edit mode and verify cross-shelf drag/drop/tap movement. |
| 11 | Settings menu | Cozy settings exist on `/settings`, but more app-level settings are needed. | Add a cohesive settings menu for display, sounds, export/import, and safety preferences. |

## Definition of done

- Users can export a complete portable backup from the app, optionally excluding metadata.
- Users can import that backup through a preview-first flow that validates the file before changing data.
- Export then import into a clean database recreates the same home configuration, slots, books, copy colors, ISBNs, shelf positions, dimensions, and unshelved copies.
- The shelf browser is readable at desktop, tablet, and 375px mobile widths.
- Users can see one shelf in detail or all shelves at once, and can move books intentionally through an explicit edit/move mode.
- `/locations` and `/settings` use clear product language and do not feel like developer/admin placeholders.
- Automated checks pass: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
- Browser smoke checks pass for `/`, `/house/3d`, `/locations`, `/settings`, `/import-export`, `/catalog`, and `/unshelved`.
- An independent reviewer agent completes a real-user pass, including vision review of screenshots, and any issues found are fixed and rechecked.
- After final validation, the release is pushed to DockerHub and Git.

## Stage 41 — Baseline audit and stage setup

**Goal:** Confirm the current implementation details before changing behavior.

**Status:** Completed.

**Tasks**

1. ~~Update `docs/current-stage.md` before starting, per `AGENTS.md`.~~
2. ~~Audit current shelf edit, move, locations, settings, and import/export surfaces.~~
3. ~~Identify exact data fields needed for round-trip export from Prisma schema and service code.~~
4. ~~Document any private local files under `import/` that must not be committed or included in Docker images.~~

**Audit findings summary**

- Shelf edit: functional but no field grouping, no live preview, no depth editing in viewer.
- Move mode: always active, no explicit toggle, no source/destination messages.
- Locations: technical labels, scene keys exposed, no human summaries, no browser links.
- Settings: admin status page, not cohesive preferences.
- Import/export: total placeholder, no nav link.
- All-bookcases overview: absent, only one-at-a-time viewing.
- Unshelved queue: works but `/unshelved` links to book page not browser.
- Round-trip fields: scene keys are stable identifiers; slots use compound key (bookshelfSceneKey, rowIndex, depthIndex); spine colors at book and copy level; authors denormalized; covers are local files.
- Privacy: `import/` properly gitignored and dockerignored; zero tracked files; no secrets.

**Likely files**

- `docs/current-stage.md`
- this plan file if details change during audit

**Acceptance criteria**

- ~~A short implementation checklist exists for the next stages.~~
- ~~No private inventory/export files are added to Git.~~

## Stage 42 — Shelf readability and shelf-edit polish

**Covers todos:** 1, 8

**Status:** Completed.

**Goal:** Make book names readable and shelf editing easy to discover/use.

**Tasks**

1. ~~Improve the `Edit shelf` button styling so it is visible without being visually noisy.~~
2. ~~Group shelf-edit fields into clear sections:~~
    - ~~identity: shelf/bookcase name;~~
    - ~~size: shelf count/rows, width units, width meters, height meters;~~
    - ~~appearance: frame, shelf, trim colors;~~
    - ~~notes.~~
3. ~~Show a compact live preview or immediate in-form explanation of what width/height/count affect.~~
4. ~~Increase shelf/book spine readability:~~
    - ~~widen shelves and spine minimums where needed;~~
    - ~~scale title/author fonts based on available spine width;~~
    - ~~ensure author/title contrast meets accessible contrast expectations;~~
    - ~~avoid text clipping where possible and gracefully fade/truncate when unavoidable.~~
5. ~~Add responsive checks for 375px, 768px, and desktop.~~
6. Use visual review: capture screenshots and send them to at least two vision-capable reviewers/observers for readability notes before finalizing.

**Likely files**

- `components/house/LivingRoomBookshelfBrowser.tsx`
- `app/globals.css`
- `lib/scene/livingRoomBrowser.ts`
- `tests/unit/livingRoomBrowser.test.ts`
- `docs/current-stage.md`

**Acceptance criteria**

- Book titles are readable enough to identify books on common shelf densities.
- Shelf count, shelf name, colors, width, and height can be changed from the shelf edit UI.
- Visual review confirms no obvious unreadable desktop/mobile shelf state.
- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass.

## Stage 43 — Locations page clarity

**Covers todo:** 2

**Status:** Completed.

**Goal:** Make `/locations` understandable for normal users who are arranging a home library.

**Tasks**

1. ~~Rename confusing labels from technical hierarchy terms where appropriate:~~
    - ~~"levels" can become "floors/areas" if clearer;~~
    - ~~"rooms" stays if useful;~~
    - ~~"bookshelves" can become "bookcases".~~
2. ~~Add an explainer at the top: locations define where books can live; the shelf browser is where browsing/moving happens.~~
3. ~~Separate advanced/destructive actions from common editing.~~
4. ~~Add confirmation UI for deletes if not already present in the current working tree.~~
5. ~~Show slot counts in human language: `5 shelves · 107 books · 3 open spots`.~~
6. ~~Link from a location/bookcase row directly to the shelf browser focused on that bookcase if technically practical.~~

**Likely files**

- `app/locations/page.tsx`
- `app/locations/actions.ts`
- `lib/db/locations.ts`
- `lib/api/routers/location.ts` if API wording/data needs adjustment
- `docs/current-stage.md`

**Acceptance criteria**

- A non-technical user can tell what the page is for in under 10 seconds.
- Common edits are separated from destructive actions.
- Location changes still preserve occupied-slot protections.
- Checks pass.

## Stage 44 — Complete export package

**Covers todos:** 3, 4, 7

**Status:** Completed.

**Goal:** Replace the "backup tools are not ready" app page with a real complete export flow.

**Primary format decision**

Use a versioned JSON backup package as the app's primary export format, not CSV. CSV remains useful for spreadsheet editing, but JSON is better for nested home configuration and round-trip fidelity.

Recommended downloadable file:

- `cozy-library-backup-v1.json`, or
- `cozy-library-backup-v1.zip` containing `manifest.json`, `library.json`, and optional asset folders if covers/photos are later included.

Start with a single JSON file unless binary assets must be included.

**Backup schema v1**

Minimum top-level shape:

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-05-21T00:00:00.000Z",
  "app": { "name": "cozy-library", "version": "0.1.0" },
  "options": { "includeMetadata": true },
  "home": {
    "levels": [],
    "rooms": [],
    "bookcases": [],
    "slots": []
  },
  "books": [],
  "copies": []
}
```

Required export content:

- Home configuration:
  - stable scene keys;
  - floors/levels;
  - rooms;
  - bookcase names;
  - shelf counts/row counts;
  - depth counts;
  - width units;
  - width/height dimensions;
  - frame/shelf/trim colors;
  - sort order;
  - notes if present.
- Slots:
  - stable slot identity or deterministic slot key;
  - bookcase scene key;
  - row number;
  - depth number;
  - human slot label, e.g. `Fawn Shelf / Shelf 2 / Spot 14`;
  - global and per-bookcase slot numbers for user-friendly review.
- Books:
  - title;
  - subtitle if present;
  - authors;
  - ISBN-10/ISBN-13;
  - publisher, published date/page count/categories if present;
  - cover path/url if present;
  - book-level spine color;
  - metadata JSON only when the toggle is enabled.
- Copies:
  - copy label;
  - status;
  - notes/condition if present;
  - assigned slot key or `null` for books waiting for a home;
  - shelf position within row;
  - copy-level spine color;
  - size fields if present in the current schema or added in a later explicit stage.

**Tasks**

1. ~~Add server-side export builder functions with deterministic ordering.~~
2. ~~Add Zod validation/schema tests for the backup structure.~~
3. ~~Add UI on `/import-export`:~~
    - ~~export button;~~
    - ~~metadata include/exclude switch;~~
    - ~~clear explanation that metadata can make the file larger/private.~~
4. ~~Add a route handler or server action that streams/downloads JSON.~~
5. ~~Keep CSV CLI links documented as advanced/manual migration tools.~~

**Likely files**

- `app/import-export/page.tsx`
- `app/import-export/actions.ts` or `app/api/export/route.ts`
- `lib/files/importExport.ts`
- `lib/validation/importExport.ts`
- `tests/unit/importExport.test.ts`
- `README.md`
- `docs/current-stage.md`

**Acceptance criteria**

- Export downloads a valid JSON backup from the app UI.
- Metadata toggle changes the exported content predictably.
- Export includes every shelf slot even when empty.
- Export ordering is stable enough for diffing.
- Checks pass.

## Stage 45 — Import preview and safe restore

**Covers todos:** 5, 6

**Status:** Completed.

**Goal:** Add an import process that accepts the Stage 44 export and safely recreates it.

**Safety model**

Use a preview-first flow. Do not apply an import immediately after upload.

Recommended import modes:

1. **Preview only:** parse and validate, show counts and warnings.
2. **Replace library:** destructive restore after explicit confirmation phrase.
3. **Merge/update:** optional later mode; do not implement first unless needed.

**Tasks**

1. ~~Add backup JSON parser and versioned validator.~~
2. ~~Build an import preview summary:~~
    - ~~levels/rooms/bookcases/slots to create/update;~~
    - ~~books/copies to create/update;~~
    - ~~unshelved copy count;~~
    - ~~metadata included/excluded;~~
    - ~~warnings for unknown schema version, duplicate ISBNs, missing slots, invalid colors, impossible dimensions.~~
3. ~~Implement transactional restore for the v1 format.~~
4. ~~Preserve or regenerate internal database IDs safely while mapping imported stable keys to new records.~~
5. ~~Add a pre-restore automatic export recommendation or require the user to confirm they have a backup.~~
6. ~~Add round-trip tests:~~
    - ~~export current database;~~
    - ~~import into an empty test database or service-level mocked transaction;~~
    - ~~export again;~~
    - ~~compare normalized backup payloads.~~
7. ~~Add user-facing error messages that explain what failed and how to fix the file.~~

**Likely files**

- `app/import-export/page.tsx`
- `app/import-export/actions.ts`
- `lib/files/importExport.ts`
- `lib/db/importExport.ts` if DB work is separated
- `lib/validation/importExport.ts`
- `tests/unit/importExport.test.ts`
- `tests/e2e/import-export.spec.ts` if Playwright coverage is practical
- `docs/current-stage.md`

**Acceptance criteria**

- Import accepts the exact export format from Stage 44.
- Invalid files fail before any data changes.
- Restore uses a transaction.
- Import/export round-trip tests pass.
- Checks pass.

## Stage 46 — All-bookcases overview and explicit move/edit mode

**Covers todos:** 9, 10

**Status:** Completed.

**Goal:** Make it easy to see all shelves and intentionally move books without accidental edits.

**Tasks**

1. ~~Add a toggle in the shelf browser:~~
    - ~~`One bookcase` detail mode;~~
    - ~~`All bookcases` overview mode.~~
2. ~~In overview mode, show all bookcases with compact rows and occupancy summaries.~~
3. ~~Clicking a bookcase jumps to detail mode focused on that bookcase.~~
4. ~~Add an explicit `Arrange books` or `Move books` mode:~~
    - ~~off by default;~~
    - ~~drag/drop and tap-to-move affordances are emphasized only when active;~~
    - ~~normal browsing remains simple when inactive.~~
5. ~~Verify moving books between bookcases, rows, and unshelved/waiting area.~~
6. ~~Make status messages clear: source, destination, and displaced book behavior.~~

**Likely files**

- `components/house/LivingRoomBookshelfBrowser.tsx`
- `app/house/actions.ts`
- `lib/db/houseBrowser.ts`
- `lib/scene/livingRoomBrowser.ts`
- `tests/unit/livingRoomBrowser.test.ts`
- `docs/current-stage.md`

**Acceptance criteria**

- User can view all bookcases without opening the locations admin page.
- User can move a book across shelves using mouse drag/drop and mobile tap controls.
- Move mode prevents accidental moving during ordinary browsing.
- Checks pass.

## Stage 47 — Cohesive settings menu

**Covers todo:** 11

**Status:** Completed.

**Goal:** Make settings feel like a real app menu, not only a database status page.

**Tasks**

1. ~~Keep database/app status visible but not dominant.~~
2. ~~Add settings sections:~~
    - ~~shelf display/readability: text size/density if implemented;~~
    - ~~sounds/ambience: existing cozy settings;~~
    - ~~import/export: metadata default and safety notes;~~
    - ~~data/privacy: where local imports/exports live and what is never uploaded.~~
3. Consider a quick-access settings button in the shelf browser that opens the same preference controls.
4. ~~Avoid pretending Docker/env-only options are live toggles unless they can actually be changed from the UI.~~

**Likely files**

- `app/settings/page.tsx`
- `components/settings/**`
- `components/house/cozyViewerSettings.tsx`
- `components/house/LivingRoomBookshelfBrowser.tsx`
- `docs/current-stage.md`

**Acceptance criteria**

- `/settings` exposes meaningful user preferences.
- Local browser settings and server/database status are clearly separated.
- Import/export metadata preference is discoverable.
- Checks pass.

## Stage 48 — End-to-end validation and documentation

**Goal:** Prove the todo list is complete, have another agent review it like a real user, fix/recheck any issues, publish DockerHub, push Git, and leave a clear handoff.

**Tasks**

1. Re-audit each `import/todo.md` line and record satisfied evidence.
2. Run automated checks:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
   - `npm audit --audit-level=high`
3. Run app smoke checks:
   - `/`
   - `/house/3d`
   - `/locations`
   - `/settings`
   - `/import-export`
   - `/catalog`
   - `/unshelved`
4. Run import/export manual checks:
   - export with metadata;
   - export without metadata;
   - preview import of each file;
   - restore into a disposable database/container;
   - verify counts and shelf placements.
5. Run visual checks at desktop, tablet, and 375px mobile.
6. Run an independent real-user review loop:
   - ask another agent to act like a first-time household-library user, not a developer;
   - the review must use the running app through the browser, not only read code;
   - include desktop and 375px mobile viewport walkthroughs;
   - include screenshots of the shelf browser, all-bookcases overview, shelf edit form, move/edit mode, locations page, settings page, and import/export page;
   - send screenshots to a vision-capable reviewer/observer for readability, layout, and “does this look usable?” feedback;
   - specifically ask the reviewer to verify every `import/todo.md` item and the export/import round-trip requirements;
   - record all found issues as a fix list.
7. Fix all reviewer-blocking issues.
8. Re-run the same reviewer/vision checks after fixes and record the second-pass result.
9. Update docs:
   - `docs/current-stage.md`
   - `README.md`
   - `docs/manual-test-checklist.md`
   - `docs/remaining-project-guide.md`
10. Prepare release/push only after validation and review pass:
    - inspect `git status --short`, `git diff`, and `git log --oneline -10`;
    - confirm no private files under `import/`, secrets, local database dumps, or screenshots that should remain private are staged;
    - commit the intended files with a concise release message;
    - build and tag Docker image with the next release tag plus `latest` and `main` if appropriate;
    - push DockerHub tags;
    - inspect DockerHub manifests/digest and record them in docs;
    - push Git branch.

**Acceptance criteria**

- All todos are either implemented or explicitly documented as not applicable with reason.
- Backup/restore round-trip is validated before release.
- Visual readability is validated with screenshots/vision review.
- Another agent has completed a first-time real-user review, issues were fixed, and the reviewer/vision pass was repeated successfully.
- Documentation tells users how to export, import, and recover safely.
- DockerHub tags and Git branch are pushed only after the final review and validation pass.

## Independent reviewer prompt template

Use this template for the required review in Stage 48:

```text
Act as a first-time real user of Cozy Library, not as the implementer. Use the running app in a browser like a household user trying to manage books.

Review goals:
1. Verify every item in import/todo.md is satisfied from the UI.
2. Confirm shelf names, shelf count, width/height, and colors are editable and understandable.
3. Confirm /locations is not confusing for normal location/bookcase management.
4. Confirm export can include the whole home configuration: numbered slots, all books, colors, ISBNs, copy positions, dimensions, and optional metadata.
5. Confirm import previews and restores the same format that export creates.
6. Confirm book names are readable at desktop, tablet, and 375px mobile widths.
7. Confirm all-bookcases overview works.
8. Confirm move/edit mode works with drag/drop and mobile tap controls.
9. Confirm /settings feels like a real settings menu.

Required walkthrough:
- Open /, /house/3d, /locations, /settings, /import-export, /catalog, and /unshelved.
- Use a desktop viewport and a 375px mobile viewport.
- Take screenshots of the shelf browser, all-bookcases overview, shelf edit form, move/edit mode, locations page, settings page, and import/export page.
- Use vision review on the screenshots for readability, tap target clarity, layout crowding, and whether the experience is understandable without documentation.
- Export with metadata and without metadata, preview both imports, and restore into a disposable database/container if available.

Return:
- Pass/fail for each import/todo.md item.
- A prioritized list of issues.
- Screenshots reviewed and vision feedback summary.
- Whether a second pass is required after fixes.
```

## Final publish checklist

Only run this after Stage 48 validation and independent recheck pass:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test`
4. `npm run build`
5. `npm audit --audit-level=high`
6. `docker compose up --build -d`
7. HTTP smoke checks for core routes.
8. `git status --short`
9. `git diff`
10. `git log --oneline -10`
11. Confirm private files/secrets are excluded.
12. Commit intended files.
13. Build Docker image.
14. Push DockerHub release, `latest`, and `main` tags as appropriate.
15. Record pushed digest in docs.
16. Push Git branch.

## Implementation guardrails

- Do not commit files under `import/`; private exports and source spreadsheets stay ignored.
- Do not hardcode secrets or provider API keys.
- Keep server-only import/export logic out of client components.
- Preserve stable scene keys and use them for backup identity mapping.
- Prefer adding tests around data migration and round-trip behavior before polishing UI.
- Do not make destructive import the default path; require preview and explicit confirmation.
- Keep app runnable after every stage.
- Update `docs/current-stage.md` before and after each implementation stage.

## Suggested execution order

1. Stage 41: audit/setup.
2. Stage 44: export schema and export UI.
3. Stage 45: import preview/restore and round-trip tests.
4. Stage 42: shelf readability and shelf-edit polish.
5. Stage 46: all-bookcases overview and explicit move mode.
6. Stage 43: locations clarity.
7. Stage 47: settings menu cohesion.
8. Stage 48: validation/docs closeout.

This order prioritizes the riskiest missing functionality first: complete export/import round-tripping. Visual and navigation polish should follow once the data safety story is reliable.
