#!/usr/bin/env bash
set -u

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
API_URL="${API_URL:-http://localhost:4000}"
DNS_RESOLVER="${DNS_RESOLVER:-1.1.1.1}"
TLS_MIN_DAYS="${TLS_MIN_DAYS:-30}"
CONNECT_TIMEOUT="${CONNECT_TIMEOUT:-8}"
MAX_TIME="${MAX_TIME:-20}"

PASS=0
FAIL=0
WARN=0
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

have_cmd() {
  command -v "$1" >/dev/null 2>&1
}

print_header() {
  echo
  echo "=== $1 ==="
}

pass() {
  PASS=$((PASS + 1))
  echo "[PASS] $1"
}

fail() {
  FAIL=$((FAIL + 1))
  echo "[FAIL] $1"
}

warn() {
  WARN=$((WARN + 1))
  echo "[WARN] $1"
}

normalize_host() {
  printf '%s\n' "$1" | sed -E 's#^[a-zA-Z]+://##' | sed -E 's#/.*$##' | cut -d ':' -f1
}

http_check() {
  local name="$1"
  local url="$2"
  local expected_csv="$3"
  local out_file="$TMP_DIR/$(echo "$name" | tr ' ' '_' | tr -cd '[:alnum:]_').json"

  local status
  status="$(curl -sS -L --connect-timeout "$CONNECT_TIMEOUT" --max-time "$MAX_TIME" \
    -o "$out_file" -w '%{http_code}' "$url" 2>/dev/null || true)"

  if [[ -z "$status" || "$status" == "000" ]]; then
    fail "$name ($url) unreachable"
    return 1
  fi

  local matched=1
  IFS=',' read -r -a statuses <<< "$expected_csv"
  matched=0
  for expected in "${statuses[@]}"; do
    if [[ "$status" == "$expected" ]]; then
      matched=1
      break
    fi
  done

  if [[ "$matched" -eq 1 ]]; then
    pass "$name returned HTTP $status"
    return 0
  fi

  fail "$name returned HTTP $status (expected: $expected_csv)"
  return 1
}

json_key_check() {
  local name="$1"
  local url="$2"
  local key="$3"
  local out_file="$TMP_DIR/$(echo "$name" | tr ' ' '_' | tr -cd '[:alnum:]_').json"

  if ! have_cmd jq; then
    warn "jq not installed, skipping JSON key assertion for $name"
    return 0
  fi

  if [[ ! -s "$out_file" ]]; then
    fail "$name response body missing for JSON assertion"
    return 1
  fi

  if jq -e "has(\"$key\")" "$out_file" >/dev/null 2>&1; then
    pass "$name contains JSON key '$key'"
  else
    fail "$name missing JSON key '$key'"
  fi
}

json_array_check() {
  local name="$1"
  local out_file="$TMP_DIR/$(echo "$name" | tr ' ' '_' | tr -cd '[:alnum:]_').json"

  if ! have_cmd jq; then
    warn "jq not installed, skipping array assertion for $name"
    return 0
  fi

  if [[ ! -s "$out_file" ]]; then
    fail "$name response body missing for JSON array assertion"
    return 1
  fi

  if jq -e 'type == "array"' "$out_file" >/dev/null 2>&1; then
    pass "$name returns a JSON array"
  else
    fail "$name does not return a JSON array"
  fi
}

dns_check() {
  local host="$1"

  if [[ -z "$host" || "$host" == "localhost" || "$host" == "127.0.0.1" ]]; then
    warn "Skipping DNS check for local host '$host'"
    return 0
  fi

  if ! have_cmd dig; then
    warn "dig not installed, skipping DNS check for $host"
    return 0
  fi

  local answers
  answers="$(dig +short "$host" @"$DNS_RESOLVER" 2>/dev/null | tr '\n' ' ' | sed 's/[[:space:]]\+$//')"

  if [[ -n "$answers" ]]; then
    pass "DNS resolved $host via $DNS_RESOLVER -> $answers"
  else
    fail "DNS resolution failed for $host via $DNS_RESOLVER"
  fi
}

tls_check() {
  local host="$1"

  if ! have_cmd openssl; then
    warn "openssl not installed, skipping TLS check for $host"
    return 0
  fi

  local cert_file="$TMP_DIR/${host}.crt"
  if ! echo | openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null \
    | openssl x509 -out "$cert_file" >/dev/null 2>&1; then
    fail "TLS handshake or certificate parse failed for $host:443"
    return 1
  fi

  local end_date
  end_date="$(openssl x509 -noout -enddate -in "$cert_file" | cut -d= -f2-)"
  pass "TLS certificate retrieved for $host (expires: $end_date)"

  if openssl x509 -checkend "$((TLS_MIN_DAYS * 86400))" -noout -in "$cert_file" >/dev/null 2>&1; then
    pass "TLS certificate for $host is valid for at least $TLS_MIN_DAYS days"
  else
    fail "TLS certificate for $host expires within $TLS_MIN_DAYS days"
  fi
}

print_header "Configuration"
echo "FRONTEND_URL=$FRONTEND_URL"
echo "API_URL=$API_URL"
echo "DNS_RESOLVER=$DNS_RESOLVER"
echo "TLS_MIN_DAYS=$TLS_MIN_DAYS"

if ! have_cmd curl; then
  echo "curl is required but not installed"
  exit 2
fi

print_header "HTTP Smoke"
http_check "Frontend Home" "$FRONTEND_URL/" "200,301,302,307,308"
http_check "Backend Health" "$API_URL/health" "200"
http_check "API Settings" "$API_URL/api/settings" "200"
http_check "API Documents" "$API_URL/api/documents" "200"
http_check "API Certifications" "$API_URL/api/certifications" "200"
http_check "API Security Updates" "$API_URL/api/security-updates" "200"

json_key_check "API Settings" "$API_URL/api/settings" "company_name"
json_key_check "API Settings" "$API_URL/api/settings" "hero_title"
json_key_check "API Settings" "$API_URL/api/settings" "primary_color"
json_array_check "API Documents"
json_array_check "API Certifications"
json_array_check "API Security Updates"

print_header "DNS Checks"
frontend_host="$(normalize_host "$FRONTEND_URL")"
api_host="$(normalize_host "$API_URL")"
dns_check "$frontend_host"
if [[ "$api_host" != "$frontend_host" ]]; then
  dns_check "$api_host"
fi

print_header "TLS Checks"
if [[ "$FRONTEND_URL" == https://* ]]; then
  tls_check "$frontend_host"
else
  warn "Skipping TLS check for frontend (non-HTTPS URL)"
fi

if [[ "$API_URL" == https://* ]]; then
  tls_check "$api_host"
else
  warn "Skipping TLS check for API (non-HTTPS URL)"
fi

print_header "Summary"
echo "PASS=$PASS FAIL=$FAIL WARN=$WARN"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi

exit 0
