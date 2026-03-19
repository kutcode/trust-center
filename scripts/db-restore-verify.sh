#!/usr/bin/env bash
set -euo pipefail

BACKUP_FILE="${1:-}"
DB_CONTAINER="${DB_CONTAINER:-trust-center-db}"
DB_USER="${DB_USER:-postgres}"
KEEP_RESTORE_DB="${KEEP_RESTORE_DB:-false}"

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: $0 <backup-file.dump>"
  exit 2
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 2
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  echo "Database container '$DB_CONTAINER' is not running"
  exit 1
fi

temp_db="restore_verify_$(date +%s)"

cleanup() {
  if [[ "$KEEP_RESTORE_DB" == "true" || "$KEEP_RESTORE_DB" == "1" ]]; then
    echo "Keeping restore verification database: $temp_db"
    return
  fi

  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS \"$temp_db\";" >/dev/null
}
trap cleanup EXIT

echo "Creating temporary restore database: $temp_db"
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"$temp_db\";" >/dev/null

echo "Restoring backup into $temp_db"
cat "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" pg_restore -U "$DB_USER" -d "$temp_db" --clean --if-exists --no-owner --no-privileges >/dev/null

echo "Running sanity checks"
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$temp_db" -v ON_ERROR_STOP=1 <<'SQL'
SELECT 'documents' AS table_name, COUNT(*) AS rows FROM documents
UNION ALL
SELECT 'document_requests' AS table_name, COUNT(*) AS rows FROM document_requests
UNION ALL
SELECT 'organizations' AS table_name, COUNT(*) AS rows FROM organizations
UNION ALL
SELECT 'trust_center_settings' AS table_name, COUNT(*) AS rows FROM trust_center_settings;
SQL

echo "Restore verification passed for: $BACKUP_FILE"
