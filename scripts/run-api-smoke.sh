#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
HURL_BIN="${HURL_BIN:-hurl}"
HURL_INSECURE="${HURL_INSECURE:-false}"
SUITE_FILE="${SUITE_FILE:-scripts/smoke-api.hurl}"

if ! command -v "$HURL_BIN" >/dev/null 2>&1; then
  echo "hurl is required. Install from https://hurl.dev/docs/installation.html"
  exit 2
fi

ARGS=(--test --variable "api_url=${API_URL}" "$SUITE_FILE")

if [[ "$HURL_INSECURE" == "true" || "$HURL_INSECURE" == "1" ]]; then
  ARGS=(--insecure "${ARGS[@]}")
fi

echo "Running API smoke suite: $SUITE_FILE"
echo "Target API URL: $API_URL"
"$HURL_BIN" "${ARGS[@]}"
