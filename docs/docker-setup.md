# Docker Setup

This app is a private/local home-library server. The Docker image contains the app code only; book data lives in PostgreSQL volumes or database dumps.

## Image tags

Recommended tags:

```bash
docker pull jbenzaquen/cozy-library:1.0.2
docker pull jbenzaquen/cozy-library:latest
docker pull jbenzaquen/cozy-library:main
```

Tag meaning:

- `1.0.2` / `latest` / `main`: clean app image, no private real-book database baked in. Pin `1.0.2` for NAS/Dockge stability.
- `demo` if published later: same app image intended for demo installs with `DEMO_CATALOG=true`.

## Fresh install

1. Copy `docker-compose.example.yml` to your server.
2. Change both database password values:
   - `POSTGRES_PASSWORD`
   - the password inside `DATABASE_URL`
3. Set `APP_BASE_URL` to your NAS/server URL.
4. Leave real-library installs on:

```env
DEMO_CATALOG=false
ALLOW_LEGACY_DATABASE_UPGRADE=false
```

5. Start:

```bash
docker compose up -d
```

Open `http://YOUR_SERVER:3000`.

## Demo install

For a demo-only stack, set:

```env
DEMO_CATALOG=true
ALLOW_LEGACY_DATABASE_UPGRADE=false
```

Advanced demo modes are still available through `DEMO_CATALOG_MODE` when needed:

- `skip`: never add demo books.
- `ensure`: add removable demo books only when missing.
- `seed`: clear/reseed removable demo books.
- `clear`: remove removable demo books.

For real libraries, use `DEMO_CATALOG=false`.

## Existing old database with no Prisma migration history

If startup fails with `P3005` and logs mention only these missing columns:

- `Book.spineColor`
- `Copy.shelfPosition`
- `Copy.spineColor`

then this is the known pre-1.0 NAS schema case.

Safe recovery:

1. Back up the database first.
2. Temporarily set:

```env
ALLOW_LEGACY_DATABASE_UPGRADE=true
```

3. Start the stack once.
4. Confirm the app starts.
5. Set it back to:

```env
ALLOW_LEGACY_DATABASE_UPGRADE=false
```

The one-time repair only adds the three nullable columns above, verifies the schema, marks committed migrations as applied, then continues normal startup.

If the schema drift is anything else, the app refuses to change it automatically.

If this database only contains demo books, delete the PostgreSQL volume and redeploy instead of using the legacy upgrade switch.

## Backup and restore

The app-level import/export page is not implemented yet. Use PostgreSQL backups or the CSV CLI.

Export one row per physical copy:

```bash
docker compose exec web npm run inventory:export:csv -- /data/cozy-library-books.csv
docker compose cp web:/data/cozy-library-books.csv ./cozy-library-books.csv
```

Import into an app database:

```bash
docker compose cp ./cozy-library-books.csv web:/data/cozy-library-books.csv
docker compose exec web npm run inventory:import:csv -- /data/cozy-library-books.csv
```

Create a compressed custom-format dump from a Compose stack:

```bash
docker compose exec -T postgres pg_dump -U library -d library -Fc > cozy-library.dump
```

Restore into an empty database:

```bash
docker compose exec -T postgres pg_restore -U library -d library --clean --if-exists < cozy-library.dump
```

If restoring onto a new empty stack, start PostgreSQL first, restore the dump, then start/restart the web container.

## Persistent data

- PostgreSQL data: `postgres-data` volume.
- App files/covers/uploads: `library-data` volume mounted at `/data`.

Do not remove volumes unless you intend to delete the library.

```bash
docker compose down      # keeps data
docker compose down -v   # deletes volumes/data
```
