# Cozy Home Library

A self-hosted physical book catalog for a home library. The app locates books by real bookshelf position and supports barcode/OCR workflows, metadata lookup, 2D house navigation, and an app-rendered living-room bookshelf browser.

## Local development

The easiest local run is Docker Compose, because it starts PostgreSQL and prepares the database automatically:

```bash
docker compose up --build
```

Open http://localhost:3000.

For framework development without the production container, start PostgreSQL first and prepare the database:

```bash
npm install
docker compose up -d postgres
$env:DATABASE_URL="postgresql://library:library_password@localhost:5432/library"
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Docker startup

Docker Compose runs the Next.js app and PostgreSQL 16.

```bash
docker compose up --build
```

Open http://localhost:3000.

The compose stack includes:

- `web`: production Next.js server
- `postgres`: PostgreSQL 16
- `postgres-data`: named volume for database persistence
- `library-data`: named volume mounted at `/data` for future cover, upload, and thumbnail storage

The `web` service is tagged locally as `jbenzaquen/cozy-library:latest` so the same image can be pushed to DockerHub after validation.

On startup, the production container applies committed Prisma migrations with `prisma migrate deploy`, then seeds the default house layout. The default house seed creates missing levels, rooms, bookshelves, and shelf slots and updates labels/sort metadata without deleting occupied shelf slots.

## DockerHub image

The living-room bookshelf browser image is published at:

```bash
docker pull jbenzaquen/cozy-library:latest
```

Published stage-specific test tags include:

```bash
docker pull jbenzaquen/cozy-library:stage22-regression
```

Last recorded pushed digest for `latest`, `stage22-regression`, `stage21-polish`, `stage20-living-room`, and `nas-house-test` from the Stage 22 publish:

```txt
sha256:cb0a6e80abc6ac4839981326379c70626b1ad9e13f485916ec6df781aceb0900
```

Stage 28 has been validated as a local Docker Compose build. Push a new image and record its digest before treating DockerHub `latest` as a Stage 28 release artifact.

Demo catalog data is opt-in. By default, Docker Compose uses `DEMO_CATALOG_MODE=skip`, which never adds demo books. Supported modes are:

- `skip`: do not create, reseed, or clear demo books.
- `ensure`: add the removable demo catalog only when those demo books are missing.
- `seed`: clear and reseed the removable demo catalog.
- `clear`: remove the demo catalog books and their copies.

Set `APP_CONTACT_EMAIL` to a real address if you want provider requests to identify a maintainer. The local default is `local-use@cozy-library.invalid`.

The main app screen and `/house/3d` now open the living-room bookshelf browser. Use the arrows or right-side shelf switcher to bring each real bookcase into the active room position.

## Catalog scale and backups

The catalog search is intentionally optimized for private home libraries, not a public multi-user index. It fetches matching catalog data into the app process for ranking polish, then renders results through a `Load more` pattern of 24 books at a time. This is expected to be comfortable for hundreds to a few thousand books on a local Docker or development install. If the library grows into the tens of thousands of books, move coarse search/filtering into PostgreSQL full-text or trigram indexes before relying on it as a daily workflow.

Import/export backup flows are intentionally deferred and hidden from primary navigation. Until those tools are implemented, use database-level backups before large catalog changes. For Docker Compose, a simple backup path is `pg_dump` against the `postgres` service or a copy of the `postgres-data` volume while the stack is stopped.

To stop the stack while keeping data:

```bash
docker compose down
```

To remove persisted data intentionally:

```bash
docker compose down -v
```

## Validation

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

### Integration tests against Docker PostgreSQL

Unit tests that require a database are skipped unless `DATABASE_URL` is set. To run the full test suite including database-backed integration tests:

```bash
docker compose up -d postgres
$env:DATABASE_URL="postgresql://library:library_password@localhost:5432/library"
npm run db:migrate
npm run db:seed
npm run test
```

## Stage status

Current work has completed Stage 28: catalog scale, import/export, and release cleanup.
