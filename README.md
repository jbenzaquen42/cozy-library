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
- `library-data`: named volume mounted at `/data` for covers/uploads/local app files

Detailed setup guides:

- `docs/docker-setup.md` for general Docker Compose setup.
- `docs/dockge-setup.md` for NAS/Dockge setup and migration recovery.
- `docker-compose.example.yml` for copy/paste server stacks.
- `.env.real-library.example` for real-library installs.
- `.env.demo.example` for demo installs.

The `web` service is tagged locally as `jbenzaquen/cozy-library:latest` so the same image can be pushed to DockerHub after validation.

On startup, the production container applies committed Prisma migrations with `prisma migrate deploy`, then seeds the default house layout. The default house seed creates missing levels, rooms, bookshelves, and shelf slots and updates labels/sort metadata without deleting occupied shelf slots.

Existing NAS databases from before 1.0 may need a one-time recovery setting if they have no Prisma migration history and are missing only the known 1.0 shelf-browser columns. See `docs/dockge-setup.md`; keep `ALLOW_LEGACY_DATABASE_UPGRADE=false` unless performing that documented one-time repair.

## DockerHub image

The release image is published at:

```bash
docker pull jbenzaquen/cozy-library:1.0.2
docker pull jbenzaquen/cozy-library:latest
docker pull jbenzaquen/cozy-library:main
```

Current pushed digest (updated after release pushes):

```txt
sha256:e19e6fdda3184cb3ff5104dea87b9055b688352a01eaad48970e11372e6092d5
```

Demo catalog data is opt-in. By default, Docker Compose uses `DEMO_CATALOG=false`, which never adds demo books. Set `DEMO_CATALOG=true` for demo installs. Advanced `DEMO_CATALOG_MODE` values are:

- `skip`: do not create, reseed, or clear demo books.
- `ensure`: add the removable demo catalog only when those demo books are missing.
- `seed`: clear and reseed the removable demo catalog.
- `clear`: remove the demo catalog books and their copies.

Set `APP_CONTACT_EMAIL` to a real address if you want provider requests to identify a maintainer. The local default is `local-use@cozy-library.invalid`.

The main app screen and `/house/3d` now open the living-room bookshelf browser. Use the arrows or right-side shelf switcher to bring each real bookcase into the active room position.

## Catalog scale and backups

The catalog search is intentionally optimized for private home libraries, not a public multi-user index. It fetches matching catalog data into the app process for ranking polish, then renders results through a `Load more` pattern of 24 books at a time. This is expected to be comfortable for hundreds to a few thousand books on a local Docker or development install. If the library grows into the tens of thousands of books, move coarse search/filtering into PostgreSQL full-text or trigram indexes before relying on it as a daily workflow.

Import/export backup flows are intentionally deferred and hidden from primary navigation. Until those tools are implemented, use database-level backups or the CSV CLI before large catalog changes. For Docker Compose, a simple backup path is `pg_dump` against the `postgres` service or a copy of the `postgres-data` volume while the stack is stopped. CSV scripts are available as `npm run inventory:export:csv -- path/to/books.csv` and `npm run inventory:import:csv -- path/to/books.csv`.

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

Stages 33–38 (pre-1.0 polish from `docs/pre-1.0-todo-plan.md`) are complete. The app is ready for 1.0.

## 1.0 living-room bookshelf features

- **Onboarding:** First-visit welcome card, help card, and mobile swipe hint explain the interaction model.
- **Copy:** Cottage-core language throughout — "Your bookcases," "Books waiting for a home," "Settle here," "Take a closer look."
- **Mobile/touch:** Bottom-sheet shelf switcher, 44px+ tap targets, swipe navigation, touch-friendly move controls.
- **Book/shelf visuals:** Book spines with caps, page edges, gold-foil text, wood-grain shelves, deterministic tilt — all CSS-only.
- **Sounds:** Local `.wav` samples (paper rustle, shelf slide, book settle, close, hearth hum) with oscillator fallback; no external audio dependency.
- **Settings:** Cozy sound/ambience/volume controls unified across the shelf viewer popover and `/settings` page.
- **No old 3D runtime:** The app builds and runs without Three.js, React Three Fiber, or GLB assets.

## Local sounds

Interaction sounds and the optional ambient loop are procedurally generated and live in `public/sounds/`. They are under 145 KB total, require no external attribution, and work fully offline.
