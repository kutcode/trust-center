#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-backups}"
DB_CONTAINER="${DB_CONTAINER:-trust-center-db}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

timestamp="$(date +%Y%m%d_%H%M%S)"
backup_file="$BACKUP_DIR/trust-center_${timestamp}.dump"
checksum_file="$backup_file.sha256"

if ! docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  echo "Database container '$DB_CONTAINER' is not running"
  exit 1
fi

echo "Creating backup: $backup_file"
docker exec -i "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -F c > "$backup_file"

if [[ ! -s "$backup_file" ]]; then
  echo "Backup file is empty: $backup_file"
  exit 1
fi

if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$backup_file" > "$checksum_file"
elif command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$backup_file" > "$checksum_file"
fi

echo "Backup complete"
ls -lh "$backup_file"
[[ -f "$checksum_file" ]] && cat "$checksum_file"

if [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "Pruning backups older than $RETENTION_DAYS days in $BACKUP_DIR"
  find "$BACKUP_DIR" -type f \( -name 'trust-center_*.dump' -o -name 'trust-center_*.dump.sha256' \) -mtime +"$RETENTION_DAYS" -print -delete || true
fi
