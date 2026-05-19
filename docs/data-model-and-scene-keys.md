# Data Model and Scene Keys

Scene keys are stable identifiers that connect database locations to future 2D and 3D house navigation.

## Rules

- Scene keys are lowercase and dot-delimited.
- Scene keys are not user-facing names.
- Display names can change without changing scene keys.
- The database hierarchy is the source of truth.
- Blender object names must match scene keys for clickable objects in later stages.
- Shelf slot addressing uses `bookshelf.sceneKey + rowIndex + depthIndex`.
- Row `1` is the top shelf; row numbers increase downward.
- Depth `1` is front; depth `2` is back in the default layout.

## Default house layout

### Levels

- Downstairs: `level.downstairs`
- Upstairs: `level.upstairs`

### Rooms

- Entry / Front Door: `room.downstairs.entry`
- Hallway: `room.upstairs.hallway`
- Reading Room / Study: `room.upstairs.study`

### Bookshelves

- Entry Shelf: `shelf.downstairs.entry.entry-shelf`, 5 rows, 2 depth
- Hallway Bookcase 1: `shelf.upstairs.hallway.bookcase-1`, 4 rows, 2 depth
- Hallway Bookcase 2: `shelf.upstairs.hallway.bookcase-2`, 4 rows, 2 depth
- Hallway Bookcase 3: `shelf.upstairs.hallway.bookcase-3`, 4 rows, 2 depth
- Study Shelf: `shelf.upstairs.study.study-shelf`, 5 rows, 2 depth

The default layout generates 44 shelf slots.

## Current schema status after Stage 7

Location models currently exist for:

- `HouseLevel`
- `Room`
- `Bookshelf`
- `ShelfSlot`

Stage 6 added minimal `Book`, `Copy`, and `CopyStatus` models only to enforce occupied shelf-slot protection. Stage 7 expanded those catalog models for manual book and copy management.

## Catalog schema rules after Stage 7

- `Book` includes manual-entry and later metadata fields.
- Missing ISBNs are stored as `null`; `isbn10` and `isbn13` are nullable unique fields.
- `Author` and `BookAuthor` support author matching and later filtering/search.
- `Copy` includes label, status, condition, notes, and exact `locationSlotId`.
- Copy labels are unique per book with `@@unique([bookId, copyLabel])`.
- Book-to-copy deletion is restricted by default; service code controls safe deletion.
- Keep shelf-slot protection: occupied slots cannot be removed by shrinking row/depth counts or deleting locations.
