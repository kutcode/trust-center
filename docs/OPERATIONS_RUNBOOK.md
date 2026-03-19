# Operations Runbook

This runbook covers day-to-day operational checks for the Trust Center stack.

## 1) End-to-end smoke test

Checks:
- Frontend HTTP reachability
- Backend health
- Core public API endpoints
- JSON contract basics
- DNS resolution for frontend/API hosts
- TLS certificate validity (for HTTPS targets)

Run:

```bash
./scripts/ops-smoke-test.sh
```

Common overrides:

```bash
FRONTEND_URL=https://demo.trustcenter.dev API_URL=https://demo.trustcenter.dev ./scripts/ops-smoke-test.sh
DNS_RESOLVER=8.8.8.8 TLS_MIN_DAYS=21 ./scripts/ops-smoke-test.sh
```

## 2) Log triage

Pulls relevant errors from running `trust-center-*` containers and groups repeated signatures.

Run:

```bash
./scripts/log-triage.sh
```

Examples:

```bash
./scripts/log-triage.sh --since 2h --tail 300
./scripts/log-triage.sh --service backend
./scripts/log-triage.sh --service storage --pattern 'error|timeout|denied'
```

## 3) API contract smoke tests (Hurl)

Validates essential public API contract behavior.

Prerequisite:
- Install Hurl: https://hurl.dev/docs/installation.html

Run:

```bash
./scripts/run-api-smoke.sh
```

Override target:

```bash
API_URL=https://demo.trustcenter.dev ./scripts/run-api-smoke.sh
```

Suite file:
- `scripts/smoke-api.hurl`

## 4) Database backup

Creates a PostgreSQL custom-format dump from `trust-center-db`.

Run:

```bash
./scripts/db-backup.sh
```

Optional:

```bash
BACKUP_DIR=backups/prod RETENTION_DAYS=30 ./scripts/db-backup.sh
```

## 5) Restore verification drill

Restores a backup into a temporary DB, runs sanity checks, then drops the temporary DB by default.

Run:

```bash
./scripts/db-restore-verify.sh backups/trust-center_YYYYMMDD_HHMMSS.dump
```

Keep temporary DB for manual inspection:

```bash
KEEP_RESTORE_DB=true ./scripts/db-restore-verify.sh backups/trust-center_YYYYMMDD_HHMMSS.dump
```

## 6) Network debug quick check

Targeted DNS/TCP/HTTP/TLS checks for incident triage.

Run:

```bash
./scripts/network-debug.sh localhost 4000 http
./scripts/network-debug.sh demo.trustcenter.dev 443 https
```

## 7) CI security scans (Trivy)

Workflow file:
- `.github/workflows/security-scan.yml`

What it does:
- Trivy filesystem scan for vulnerabilities and misconfigurations
- Trivy container image scan for backend and frontend images
- Fails CI on HIGH/CRITICAL findings

## 8) Deployed API smoke workflow (Hurl)

Workflow file:
- `.github/workflows/api-smoke-deployed.yml`

Trigger options:
- Manual: `workflow_dispatch` with optional `api_url` input
- Scheduled: every 6 hours

URL resolution order:
1. Workflow input `api_url`
2. Repository variable `SMOKE_API_URL`
3. Repository secret `SMOKE_API_URL`

If none are set, the workflow fails fast with a clear configuration message.
