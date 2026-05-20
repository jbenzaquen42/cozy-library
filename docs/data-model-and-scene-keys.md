# Data Model and Scene Keys

Scene keys are stable identifiers that connect database locations to 2D and 3D house navigation. `prisma/schema.prisma` is the authoritative schema; this document explains the project rules.

## Core rules

- The database hierarchy is the source of truth.
- Scene keys are lowercase and dot-delimited.
- Scene keys are not primary user-facing names.
- Display names can change without changing scene keys.
- App-generated 2D/3D objects should store scene keys directly, usually in `userData.sceneKey`.
- Blender helper object names may use prefixes such as `floor_select.` or `room_select.` and resolve back to scene keys.
- Final shelf scene keys belong to app-generated modular bookshelves, not baked scan shelves.
- Shelf slot addressing uses `bookshelf.sceneKey + rowIndex + depthIndex`.
- Row `1` is the top shelf; row numbers increase downward.
- Depth `1` is front; depth `2` is back in the default layout.

## Location hierarchy

```txt
HouseLevel
  Room
    Bookshelf
      ShelfSlot
        Copy
          Book
```

## Default house layout

### Levels

- Downstairs: `level.downstairs`
- Upstairs: `level.upstairs`

### Rooms

- Entry / Front Door: `room.downstairs.entry`
- Hallway: `room.upstairs.hallway`
- Reading Room / Study: `room.upstairs.study`

### Bookshelves

- Entry Shelf: `shelf.downstairs.entry.entry-shelf`, 5 rows, 2 depth.
- Hallway Bookcase 1: `shelf.upstairs.hallway.bookcase-1`, 3 rows, 2 depth.
- Hallway Bookcase 2: `shelf.upstairs.hallway.bookcase-2`, 3 rows, 2 depth.
- Hallway Bookcase 3: `shelf.upstairs.hallway.bookcase-3`, 3 rows, 2 depth.
- Study Shelf: `shelf.upstairs.study.study-shelf`, 4 rows, 2 depth.

The default layout generates 36 shelf slots.

## Current model groups after Stage 14

Main model groups:

- `HouseLevel`
- `Room`
- `Bookshelf`
- `ShelfSlot`
- `Book`
- `Author`
- `BookAuthor`
- `Copy`
- `Loan`
- `MetadataCache`
- `UploadedImage`

## Catalog and copy rules

- Missing ISBNs are stored as `null`; `isbn10` and `isbn13` are nullable unique fields.
- `Author` and `BookAuthor` support author matching and filtering/search.
- `Copy` represents a physical copy and includes label, status, condition, notes, and exact `locationSlotId`.
- Copy labels are unique per book.
- Loan belongs to `Copy`, not `Book`.
- Service code controls safe book/copy deletion.
- Occupied shelf slots must not be deleted by shrinking row/depth counts or deleting locations.

## Blender helper names

The exported GLB should use helpers for floor/room picking, not final shelf inventory:

```txt
floor_select.level.downstairs
floor_select.level.upstairs
room_select.room.downstairs.entry
room_select.room.upstairs.hallway
room_select.room.upstairs.study
```

Future app code should warn when a helper name cannot resolve to a known scene key.

## Bookshelf placement fields

Bookshelves include optional persisted placement/configuration fields retained for compatibility with prior layout work:

```txt
preset
widthMeters
heightMeters
depthMeters
positionX
positionY
positionZ
rotationX
rotationY
rotationZ
frameColor
shelfColor
backPanelColor
```

The active living-room browser does not currently expose direct shelf placement editing; it uses the stored bookshelf records, row/depth counts, slots, and copies to render a switchable active bookshelf view. Browser `localStorage` is not authoritative inventory data.
