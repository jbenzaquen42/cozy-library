# Technical Architecture

The selected stack is Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Prisma, tRPC, Zod, and Docker Compose.

## Current architecture status

- Next.js App Router is in place.
- PostgreSQL runs through Docker Compose.
- Prisma is installed and used by seed/service code.
- tRPC routers and Zod schemas exist for the application surface.
- The location admin service and UI are implemented.
- The default house layout is seeded with stable scene keys.

## Schema status after Stage 7

Stage 2's full schema/migration foundation was not completed before later stages. Stage 6 added minimal `Book`, `Copy`, and `CopyStatus` models to support occupied shelf-slot protection. Stage 7 reconciled those models enough for manual book and copy management.

Current Stage 7 schema includes:

- a Prisma migration baseline;
- expanded `Book` fields for manual entry and later metadata;
- nullable unique ISBN fields;
- `Author` and `BookAuthor`;
- richer `Copy` fields and constraints;
- restricted `Book -> Copy` deletion;
- service-layer copy-label assignment and safe copy movement/deletion.

Future metadata, search, loan, and import/export stages may add more fields/indexes, but manual book entry is no longer built on the temporary Stage 6 schema.
