#!/bin/sh
set -e

# Parse host and port from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:/]*\).*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_PORT=${DB_PORT:-5432}

echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  sleep 1
done
echo "Database is reachable."

echo "Pushing database schema..."
pnpm db:push

echo "Seeding database..."
pnpm db:seed

echo "Building Next.js app..."
pnpm build

# Standalone output needs static files and public dir copied in
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "Starting server..."
node .next/standalone/server.js
