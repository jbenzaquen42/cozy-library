# Dockge Setup

Use this when running Cozy Home Library on a NAS through Dockge.

## Recommended stack

Use `docker-compose.example.yml` as the starting point. In Dockge:

1. Create a new stack.
2. Paste the compose YAML.
3. Change `POSTGRES_PASSWORD` and the password embedded in `DATABASE_URL` to the same strong value.
4. Set `APP_BASE_URL` to your NAS URL, for example:

```env
APP_BASE_URL=http://192.168.1.50:3000
```

5. For a real library, keep:

```env
DEMO_CATALOG=false
ALLOW_LEGACY_DATABASE_UPGRADE=false
```

6. Deploy the stack.

## Environment reference

```env
DATABASE_URL=postgresql://library:YOUR_PASSWORD@postgres:5432/library
APP_DATA_DIR=/data
APP_BASE_URL=http://YOUR_NAS_IP_OR_HOSTNAME:3000
APP_CONTACT_EMAIL=local-use@cozy-library.invalid
GOOGLE_BOOKS_API_KEY=
ISBNDB_API_KEY=
HARDCOVER_API_TOKEN=
HARDCOVER_API_TOKEN_FILE=
ENABLE_OCR=true
DEMO_CATALOG=false
ALLOW_LEGACY_DATABASE_UPGRADE=false
```

## Demo mode

For a demo stack, set:

```env
DEMO_CATALOG=true
```

For a real library, set:

```env
DEMO_CATALOG=false
```

Advanced modes remain available through `DEMO_CATALOG_MODE=skip|ensure|seed|clear`. Do not use `seed` on a real library unless you intentionally want to clear/reseed removable demo books.

## Fixing the P3005 / no migration history error

If Dockge logs show:

```txt
Error: P3005
The database schema is not empty.
Existing database has no Prisma migration history.
Changed the Book table [+] spineColor
Changed the Copy table [+] shelfPosition, spineColor
```

then your NAS database was created before the 1.0 migrations were committed.

If this stack only has demo books, the simplest and safest recovery is deleting the PostgreSQL volume and redeploying with `DEMO_CATALOG=false` or `DEMO_CATALOG=true` as desired.

Recovery path for a real old database:

1. Back up the database/volume first.
2. In Dockge, set:

```env
ALLOW_LEGACY_DATABASE_UPGRADE=true
```

3. Redeploy/start the stack once.
4. Wait for the app to start successfully.
5. Change it back to:

```env
ALLOW_LEGACY_DATABASE_UPGRADE=false
```

6. Redeploy/restart again.

The repair is intentionally narrow. It only handles the known missing nullable columns used by the 1.0 shelf browser. If logs show different schema drift, do not force it; restore from backup or ask for a targeted migration.

## Real books are not in the image

DockerHub images do not contain private book data. Your library data is in PostgreSQL. Move it between machines using a database dump or CSV export, not by baking it into the image.

## Import/export status

The app UI does not currently support backup upload/restore. Use `pg_dump` / `pg_restore`, Docker volume backups, or the CSV CLI:

```bash
docker compose exec web npm run inventory:export:csv -- /data/cozy-library-books.csv
docker compose cp web:/data/cozy-library-books.csv ./cozy-library-books.csv
```
