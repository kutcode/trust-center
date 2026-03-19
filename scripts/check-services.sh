#!/usr/bin/env bash
set -u

TAIL_LINES="${TAIL_LINES:-40}"

section() {
  echo
  echo "=== $1 ==="
}

container_logs() {
  local container="$1"
  if docker ps --format '{{.Names}}' | grep -qx "$container"; then
    echo "--- $container (last $TAIL_LINES lines) ---"
    docker logs "$container" --tail "$TAIL_LINES" 2>&1 || true
  else
    echo "--- $container is not running ---"
  fi
}

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required"
  exit 2
fi

section "Container Status"
docker ps --filter "name=trust-center" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

section "Core Service Logs"
container_logs trust-center-backend
container_logs trust-center-frontend
container_logs trust-center-kong
container_logs trust-center-rest
container_logs trust-center-meta
container_logs trust-center-auth
container_logs trust-center-mailpit

section "Database Connectivity"
if docker ps --format '{{.Names}}' | grep -qx trust-center-db; then
  docker exec -i trust-center-db psql -U postgres -d postgres -c "SELECT NOW() AS db_time, version();" 2>&1 || true
else
  echo "trust-center-db is not running"
fi

section "HTTP Health Checks"
curl -sS -m 5 http://localhost:3000/ >/dev/null && echo "frontend: OK" || echo "frontend: FAIL"
curl -sS -m 5 http://localhost:4000/health && echo || echo "backend health: FAIL"
curl -sS -m 5 http://localhost:4000/api/settings >/dev/null && echo "api settings: OK" || echo "api settings: FAIL"
curl -sS -m 5 http://localhost:8000/rest/v1/ >/dev/null && echo "postgrest gateway: OK" || echo "postgrest gateway: FAIL"

if [[ -x "./scripts/log-triage.sh" ]]; then
  section "Error Triage (last 30m)"
  ./scripts/log-triage.sh --since 30m --tail 120 --pattern 'error|exception|failed|timeout|denied|panic|(^|[[:space:]])5[0-9]{2}([[:space:]]|$)' || true
fi

section "Done"
