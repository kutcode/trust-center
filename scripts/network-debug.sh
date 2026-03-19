#!/usr/bin/env bash
set -u

TARGET_HOST="${1:-localhost}"
TARGET_PORT="${2:-4000}"
TARGET_SCHEME="${3:-http}"
DNS_RESOLVER="${DNS_RESOLVER:-1.1.1.1}"

print_section() {
  echo
  echo "=== $1 ==="
}

print_section "Target"
echo "HOST=$TARGET_HOST"
echo "PORT=$TARGET_PORT"
echo "SCHEME=$TARGET_SCHEME"

print_section "DNS"
if command -v dig >/dev/null 2>&1; then
  dig +short "$TARGET_HOST" @"$DNS_RESOLVER" || true
else
  echo "dig not installed"
fi

print_section "TCP Reachability"
if command -v nc >/dev/null 2>&1; then
  nc -vz "$TARGET_HOST" "$TARGET_PORT" 2>&1 || true
else
  echo "nc not installed"
fi

print_section "Local Listeners"
if command -v lsof >/dev/null 2>&1; then
  lsof -nP -iTCP:"$TARGET_PORT" -sTCP:LISTEN || true
else
  echo "lsof not installed"
fi

print_section "HTTP Probe"
if command -v curl >/dev/null 2>&1; then
  curl -sS -o /dev/null -D - --max-time 10 "$TARGET_SCHEME://$TARGET_HOST:$TARGET_PORT/" | sed -n '1,20p'
else
  echo "curl not installed"
fi

if [[ "$TARGET_SCHEME" == "https" || "$TARGET_PORT" == "443" ]]; then
  print_section "TLS Handshake"
  if command -v openssl >/dev/null 2>&1; then
    echo | openssl s_client -servername "$TARGET_HOST" -connect "$TARGET_HOST:$TARGET_PORT" 2>/dev/null \
      | openssl x509 -noout -subject -issuer -dates || true
  else
    echo "openssl not installed"
  fi
fi

print_section "Container Port Map"
if command -v docker >/dev/null 2>&1; then
  docker ps --filter "name=trust-center" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
  echo "docker not installed"
fi
