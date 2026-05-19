# Implementation Plan

Follow the staged implementation plan from the source documentation. Complete one stage at a time and run that stage's exit checks before continuing.

## Stage 7 sequencing note

Stages 0-6 were completed before Stage 2's full schema/migration foundation was finished. Stage 6 added minimal `Book`, `Copy`, and `CopyStatus` models only so occupied shelf-slot protection could be enforced.

Stage 7 began with the required schema/migration catch-up:

1. Create a Prisma migration baseline for the current schema.
2. Reconcile the catalog schema with the intended data model:
   - `Book` fields needed for manual entry and later metadata;
   - nullable unique `isbn10` and `isbn13`;
   - `Author` and `BookAuthor`;
   - `Copy` fields including label, status, condition, notes, and `locationSlotId`;
   - safe relation behavior that does not accidentally delete located copies.
3. Add a tested helper/service rule for copy labels: first copy `1`, then `2`, `3`, etc.
4. Prefer restrictive/default-safe deletes; explicit confirmed delete behavior should live in service code.
5. Normalize empty ISBN strings to `null`.

This catch-up is now complete enough for manual book and copy management. Continue future stages from the reconciled Stage 7 schema.

## Stage 7 adjustment

Stage 7 started with database/service consistency before UI:

- migration baseline;
- complete enough book/copy/author schema for manual add;
- copy-label tests;
- service functions for create book, add copy, rename copy label, move copy, and safe delete checks;
- then `/books/new`, `/books/[id]`, and `/books/[id]/edit` pages.

Do not add metadata provider calls, scanning, catalog search, 2D house browsing, or 3D house browsing in Stage 7.
