#!/usr/bin/env bash
set -u

SINCE="${SINCE:-30m}"
TAIL_LINES="${TAIL_LINES:-250}"
SERVICE=""
PATTERN="${PATTERN:-}"

if [[ -z "$PATTERN" ]]; then
  PATTERN='error|exception|fatal|panic|failed|denied|timeout|refused|unavailable|(^|[[:space:]])5[0-9]{2}([[:space:]]|$)'
fi

usage() {
  cat <<USAGE
Usage: $0 [--since <duration>] [--tail <lines>] [--service <name>] [--pattern <regex>]

Examples:
  $0
  $0 --since 2h --tail 400
  $0 --service backend
  $0 --service storage --pattern 'error|timeout|denied'
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --since)
      SINCE="$2"
      shift 2
      ;;
    --tail)
      TAIL_LINES="$2"
      shift 2
      ;;
    --service)
      SERVICE="$2"
      shift 2
      ;;
    --pattern)
      PATTERN="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 2
      ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required"
  exit 2
fi

if command -v rg >/dev/null 2>&1; then
  FILTER_CMD=(rg -i -e "$PATTERN")
else
  FILTER_CMD=(grep -Ei "$PATTERN")
fi

resolve_container() {
  local value="$1"
  if [[ "$value" == trust-center-* ]]; then
    printf '%s\n' "$value"
    return
  fi
  printf 'trust-center-%s\n' "$value"
}

collect_containers() {
  if [[ -n "$SERVICE" ]]; then
    resolve_container "$SERVICE"
    return
  fi

  docker ps --format '{{.Names}}' | grep '^trust-center-' || true
}

CONTAINERS="$(collect_containers)"
if [[ -z "$CONTAINERS" ]]; then
  echo "No running trust-center containers found"
  exit 1
fi

echo "=== Log Triage ==="
echo "since=$SINCE tail=$TAIL_LINES"
echo "pattern=$PATTERN"

while IFS= read -r container; do
  [[ -z "$container" ]] && continue

  echo
  echo "--- $container ---"

  if ! docker ps --format '{{.Names}}' | grep -qx "$container"; then
    echo "[WARN] container not running"
    continue
  fi

  echo "[Recent matches]"
  recent_matches="$(docker logs --since "$SINCE" "$container" 2>&1 | "${FILTER_CMD[@]}" || true)"
  if [[ -n "$recent_matches" ]]; then
    echo "$recent_matches" | tail -n "$TAIL_LINES"
  else
    echo "No matching log lines in the selected window"
  fi

  echo
  echo "[Top repeated matches]"
  signatures="$(docker logs --since "$SINCE" "$container" 2>&1 \
    | "${FILTER_CMD[@]}" \
    | sed 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}[^ ]* //g' \
    | sed 's/\[[^]]*\]//g' \
    | sed 's/[[:space:]]\+/ /g' \
    | sort | uniq -c | sort -nr | head -n 10 || true)"
  if [[ -n "$signatures" ]]; then
    echo "$signatures"
  else
    echo "No repeated signatures found"
  fi
done <<< "$CONTAINERS"
