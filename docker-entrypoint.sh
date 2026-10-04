#!/bin/sh
set -e

if [ "${SKIP_DB_MIGRATE:-}" != "1" ]; then
  echo "Applying Prisma migrations..."
  (
    cd /opt/prisma
    prisma migrate deploy
  )
fi

exec "$@"
