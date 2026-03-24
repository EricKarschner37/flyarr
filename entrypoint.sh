#!/bin/sh
set -e

echo "Waiting for database..."
until nc -z postgres 5432 2>/dev/null; do
  sleep 1
done
echo "Database is reachable."

echo "Pushing database schema..."
pnpm db:push

echo "Seeding database..."
pnpm db:seed

echo "Building Next.js app..."
pnpm build

echo "Starting server..."
node .next/standalone/server.js
