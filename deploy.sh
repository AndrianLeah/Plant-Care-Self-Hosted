#!/usr/bin/env bash
# deploy.sh — Run this ON the VPS to deploy / update the app.
# Usage:  bash deploy.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Pulling latest code..."
git -C "$APP_DIR" pull --ff-only

echo "==> Building and starting containers..."
docker compose -f "$APP_DIR/docker-compose.yml" --env-file "$APP_DIR/.env" up -d --build

echo "==> Removing dangling images..."
docker image prune -f

echo "==> Done! App is running."
docker compose -f "$APP_DIR/docker-compose.yml" ps
