#!/bin/sh
set -eu

mark_all_migrations_applied() {
  for migration_dir in prisma/migrations/*; do
    [ -d "$migration_dir" ] || continue
    npx prisma migrate resolve --applied "$(basename "$migration_dir")"
  done
}

apply_known_legacy_schema_sync() {
  echo "Applying known legacy schema sync for pre-1.0 NAS databases..."
  node <<'NODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "spineColor" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "Copy" ADD COLUMN IF NOT EXISTS "shelfPosition" INTEGER');
  await prisma.$executeRawUnsafe('ALTER TABLE "Copy" ADD COLUMN IF NOT EXISTS "spineColor" TEXT');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
NODE
}

is_known_legacy_diff() {
  diff_script="$1"
  echo "$diff_script" | grep -F 'ALTER TABLE "Book" ADD COLUMN "spineColor" TEXT;' >/dev/null 2>&1 || return 1
  echo "$diff_script" | grep -F 'ALTER TABLE "Copy" ADD COLUMN "shelfPosition" INTEGER;' >/dev/null 2>&1 || return 1
  echo "$diff_script" | grep -F 'ALTER TABLE "Copy" ADD COLUMN "spineColor" TEXT;' >/dev/null 2>&1 || return 1

  non_comment_lines="$(echo "$diff_script" | sed '/^[[:space:]]*$/d; /^[[:space:]]*--/d')"
  line_count="$(echo "$non_comment_lines" | wc -l | tr -d ' ')"
  [ "$line_count" = "3" ]
}

handle_p3005() {
  echo "Existing database has no Prisma migration history. Checking schema before baselining migrations..."

  if npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code; then
    mark_all_migrations_applied
    npx prisma migrate deploy
    return
  fi

  echo "Existing database schema differs from the committed Prisma schema."
  echo "Generating schema drift script for safety check..."
  DIFF_SCRIPT="$(npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script 2>&1)"
  echo "$DIFF_SCRIPT"

  if is_known_legacy_diff "$DIFF_SCRIPT"; then
    LEGACY_UPGRADE="${ALLOW_LEGACY_DATABASE_UPGRADE:-false}"
    if [ "$LEGACY_UPGRADE" != "true" ] && [ "${COZY_LEGACY_SCHEMA_SYNC:-false}" = "true" ]; then
      echo "COZY_LEGACY_SCHEMA_SYNC is deprecated; use ALLOW_LEGACY_DATABASE_UPGRADE=true instead."
      LEGACY_UPGRADE="true"
    fi

    if [ "$LEGACY_UPGRADE" = "true" ]; then
      echo "ALLOW_LEGACY_DATABASE_UPGRADE=true detected. This one-time repair only adds nullable spine/position columns."
      echo "Make sure you have a database backup before using this on important data."
      apply_known_legacy_schema_sync

      echo "Verifying schema now matches committed Prisma schema..."
      npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code
      mark_all_migrations_applied
      npx prisma migrate deploy
      return
    fi

    echo "Detected a known older Cozy Library database missing only Book.spineColor, Copy.shelfPosition, and Copy.spineColor."
    echo "Refusing to change it automatically because ALLOW_LEGACY_DATABASE_UPGRADE is not true."
    echo "If this database only has demo books, delete the PostgreSQL volume and redeploy instead."
    echo "If this is a real old database, back it up, temporarily set ALLOW_LEGACY_DATABASE_UPGRADE=true, start once, then set it back to false."
    exit 1
  fi

  echo "Schema drift is not the known safe legacy case. Refusing automatic migration baseline."
  echo "Use pg_dump/volume backup first, then repair the database manually or restore into a fresh stack."
  exit 1
}

if [ -n "${DATABASE_URL:-}" ]; then
  echo "Applying database migrations..."
  MIGRATE_OUTPUT="$(npx prisma migrate deploy 2>&1)" || {
    echo "$MIGRATE_OUTPUT"

    case "$MIGRATE_OUTPUT" in
      *P3005*)
        handle_p3005
        ;;
      *)
        exit 1
        ;;
    esac
  }
  echo "$MIGRATE_OUTPUT"

  echo "Seeding default house..."
  npm run db:seed

  if [ -n "${DEMO_CATALOG_MODE:-}" ]; then
    DEMO_MODE="$DEMO_CATALOG_MODE"
  elif [ "${DEMO_CATALOG:-false}" = "true" ]; then
    DEMO_MODE="ensure"
  else
    DEMO_MODE="skip"
  fi
  if [ "$DEMO_MODE" = "ensure" ]; then
    echo "Ensuring removable demo catalog..."
    npm run demo:ensure
  elif [ "$DEMO_MODE" = "seed" ]; then
    echo "Reseeding removable demo catalog..."
    npm run demo:seed
  elif [ "$DEMO_MODE" = "clear" ]; then
    echo "Clearing removable demo catalog..."
    npm run demo:clear
  else
    echo "Skipping demo catalog seed (DEMO_CATALOG_MODE=$DEMO_MODE)."
  fi
else
  echo "DATABASE_URL is not set; skipping database preparation."
fi

exec node server.js
