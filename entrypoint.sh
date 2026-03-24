#!/bin/sh
set -e

echo "Pushing database schema..."
pnpm db:push

echo "Seeding database..."
pnpm db:seed

echo "Building Next.js app..."
pnpm build

echo "Starting server..."
node .next/standalone/server.js
