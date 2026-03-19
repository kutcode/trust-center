#!/usr/bin/env bash
set -u

TAIL_LINES="${TAIL_LINES:-120}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required"
  exit 2
fi

echo "=== Storage Status ==="
docker ps -a --filter "name=trust-center-storage" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"

echo
echo "=== Storage Logs (last $TAIL_LINES lines) ==="
docker logs trust-center-storage --tail "$TAIL_LINES" 2>&1 || true

echo
echo "=== Storage API Probe ==="
if curl -sS -m 5 http://localhost:5001/status >/dev/null 2>&1; then
  echo "storage status endpoint: OK"
elif curl -sS -m 5 http://localhost:5001/health >/dev/null 2>&1; then
  echo "storage health endpoint: OK"
else
  echo "Storage API not responding on /status or /health"
fi

echo
echo "=== Volume Check ==="
docker volume ls | grep -E 'supabase-storage-data|storage' || echo "No matching storage volumes"

echo
echo "=== Done ==="
