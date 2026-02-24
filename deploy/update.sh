#!/bin/bash
# =============================================================
# Quick update script - rebuild and restart containers
# =============================================================

set -e

cd "$(dirname "$0")/.."

echo "Pulling latest changes..."
git pull 2>/dev/null || echo "Not a git repo, skipping pull."

echo "Rebuilding and restarting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "Cleaning up old images..."
docker image prune -f

echo ""
echo "Update complete! Access: http://$(curl -s ifconfig.me 2>/dev/null || echo '<YOUR_PUBLIC_IP>')"
