#!/bin/bash
# =============================================================
# Deploy / Update script
# Pulls pre-built images from GHCR and restarts containers.
# =============================================================

set -e

cd "$(dirname "$0")/.."

# ---- Load GHCR_REPO from .env ----
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep GHCR_REPO | xargs)
fi

if [ -z "$GHCR_REPO" ]; then
  echo "ERROR: GHCR_REPO is not set."
  echo "Add GHCR_REPO=ghcr.io/<owner>/chatbot-builder to your .env file."
  exit 1
fi

echo "=========================================="
echo "  Pulling latest images from GHCR..."
echo "  Repo: $GHCR_REPO"
echo "=========================================="

docker compose -f docker-compose.prod.yml pull

echo ""
echo "Restarting containers..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo ""
echo "Cleaning up old images..."
docker image prune -f

echo ""
echo "=========================================="
echo "  Deploy complete!"
echo "  Access: http://$(curl -s ifconfig.me 2>/dev/null || echo '<YOUR_PUBLIC_IP>')"
echo "=========================================="
