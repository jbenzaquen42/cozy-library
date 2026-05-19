# Cozy Home Library

A self-hosted physical book catalog for a home library. The app will locate books by real bookshelf position and later support barcode scanning, OCR, metadata lookup, 2D house navigation, and Blender-backed 3D navigation.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Docker startup

Stage 1 adds Docker Compose for the Next.js app and PostgreSQL 16.

```bash
docker compose up --build
```

Open http://localhost:3000.

The compose stack includes:

- `web`: production Next.js server
- `postgres`: PostgreSQL 16
- `postgres-data`: named volume for database persistence
- `library-data`: named volume mounted at `/data` for future cover, upload, and thumbnail storage

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
```

## Stage status

Stage 0 provides the Next.js, TypeScript, Tailwind, ESLint, folder, environment, and documentation foundation only.

Stage 1 provides Docker Compose and PostgreSQL only. Prisma schema, catalog features, scanning, metadata lookup, 2D house, and 3D house features are intentionally out of scope until their stages.
