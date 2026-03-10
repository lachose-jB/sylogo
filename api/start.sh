#!/bin/sh
set -e

echo "▶ Running Prisma migrations..."
cd /app/back_end && npx prisma migrate deploy

echo "▶ Starting API server..."
cd /app/api && node src/index.js
