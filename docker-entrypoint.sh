#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  echo "Applying database migrations..."
  MIGRATE_OUTPUT="$(npx prisma migrate deploy 2>&1)" || {
    echo "$MIGRATE_OUTPUT"

    case "$MIGRATE_OUTPUT" in
      *P3005*)
        echo "Existing database has no Prisma migration history. Checking schema before baselining migrations..."
        if npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code; then
          for migration_dir in prisma/migrations/*; do
            [ -d "$migration_dir" ] || continue
            npx prisma migrate resolve --applied "$(basename "$migration_dir")"
          done
          npx prisma migrate deploy
        else
          echo "Existing database schema differs from the committed Prisma schema. Refusing automatic migration baseline."
          exit 1
        fi
        ;;
      *)
        exit 1
        ;;
    esac
  }
  echo "$MIGRATE_OUTPUT"

  echo "Seeding default house..."
  npm run db:seed

  DEMO_MODE="${DEMO_CATALOG_MODE:-skip}"
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
