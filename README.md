# The Open GRC Trust Center

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/kutcode/trust-center/actions/workflows/ci.yml/badge.svg)](https://github.com/kutcode/trust-center/actions/workflows/ci.yml)
[![Security Scan](https://github.com/kutcode/trust-center/actions/workflows/security-scan.yml/badge.svg)](https://github.com/kutcode/trust-center/actions/workflows/security-scan.yml)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

An open-source security trust center platform for **The Open GRC** ecosystem, available under **[theopengrc.com](https://theopengrc.com)**. Built with Next.js 15, Docker, and Supabase, featuring organization-level document approval, magic link access, and comprehensive admin management.

> 🎯 **[Try the Live Demo →](https://demo.trustcenter.dev)**
> Explore the full Trust Center experience — public site and admin panel — with sample data. No setup required.
> Demo credentials: `demo@trustcenter.io` / `demo123`

## Features

- **Public Security Documentation**: Display compliance certifications, security updates, and public documents
- **Document Request System**: Users can request access to restricted documents without creating accounts
- **Magic Link Access**: Time-limited access links sent via email (no login required)
- **Organization Whitelisting**: Track approved documents per organization for granular access control
- **Auto-Approval**: Organizations with previously approved documents get instant access
- **Admin Console**: Full-featured admin panel for document management, request approval, and customization
- **Salesforce Integration (OAuth)**: Connect Salesforce and sync customer/account status to automatically manage organization access
- **Trust Center Customization**: Customize branding, colors, hero section, and content
- **Multi-Layer Security**: Role-based access control with database, API, frontend, and storage protection

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth (admin-only), Magic links for document access
- **Storage**: Supabase Storage
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions (CI build/lint/test, Trivy security scan, API smoke tests)
- **Testing**: Jest + Supertest (backend), ESLint (frontend + backend)
- **Email**: Resend API (production) / Mailpit (development) for secure email delivery with attachments

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)
- Git

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/kutcode/trust-center.git
   cd trust-center
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration (optional for local development)
   ```

3. **Start all services**
   ```bash
   docker-compose up
   ```

   This will:
   - Start Supabase local stack (PostgreSQL, Auth, Storage)
   - Run database migrations
   - Start backend API on port 4000
   - Start frontend on port 3000

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Supabase Studio: http://localhost:54323
   - Mailpit (email testing): http://localhost:8025

## Email Configuration

This project supports multiple email providers through `EMAIL_PROVIDER`:
- `mailpit` for local development/testing (default)
- `resend` for production/live delivery (recommended)
- `smtp` and `sendgrid` as optional alternatives

### Quick Setup

1. **For Development** (emails captured locally):
   - No configuration needed: emails are captured by Mailpit
   - View emails at http://localhost:8025

2. **For Production** (real email delivery):
   - Sign up at [Resend.com](https://resend.com) (free tier: 3,000 emails/month)
   - Get your API key from the dashboard
   - Add to `.env`:
     ```env
     EMAIL_PROVIDER=resend
     RESEND_API_KEY=re_your_api_key_here
     SMTP_FROM=noreply@theopengrc.com
     ```
   - Restart backend: `docker-compose up -d --force-recreate backend`

📖 **Full Email Setup Guide**: See [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md) for detailed instructions, custom domain setup, security best practices, and troubleshooting.

## Initial Setup

### Create Admin User

1. Access Supabase Studio at http://localhost:54323
2. Go to Authentication → Users → Add User
3. Create a user with email and password
4. Note the user ID
5. Insert into `admin_users` table:
   ```sql
   INSERT INTO admin_users (id, email, full_name, role)
   VALUES ('<user-id>', 'admin@example.com', 'Admin User', 'admin');
   ```

### Seed Data

The migrations include seed data for:
- Document categories (SOC 2 Reports, Privacy Policies, etc.)
- Default trust center settings

## Project Structure

```
trust-center/
├── docker-compose.yml          # Development Docker Compose
├── docker-compose.prod.yml     # Production Docker Compose
├── frontend/                   # Next.js frontend application
│   ├── src/
│   │   ├── app/               # App router pages
│   │   ├── components/        # React components
│   │   ├── lib/              # Utilities and Supabase clients
│   │   └── types/             # TypeScript types
│   ├── Dockerfile             # Production Dockerfile (multi-stage)
│   └── Dockerfile.dev         # Development Dockerfile
├── backend/                    # Express backend API
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   │   └── admin/        # Admin routes (modular)
│   │   ├── middleware/       # Auth, rate limiting, error handling
│   │   │   └── __tests__/    # Middleware tests
│   │   ├── services/         # Email, Salesforce, webhooks
│   │   └── utils/            # Utility functions
│   │       └── __tests__/    # Utility tests
│   ├── Dockerfile             # Production Dockerfile
│   └── Dockerfile.dev         # Development Dockerfile
├── supabase/                  # Supabase configuration
│   ├── migrations/            # Database migrations
│   ├── config.toml           # Supabase local config
│   └── kong.yml              # Kong API gateway config
├── scripts/                   # Operational scripts
└── .github/workflows/         # CI/CD pipelines
```

## Environment Variables

See `.env.example` for all available environment variables:

- `JWT_SECRET`: Secret for JWT tokens
- `ANON_KEY`: Supabase anonymous key
- `SERVICE_KEY`: Supabase service role key
- `EMAIL_PROVIDER`: Email backend (`mailpit`, `resend`, `smtp`, `sendgrid`)
- `RESEND_API_KEY`: Required when `EMAIL_PROVIDER=resend`
- `SMTP_*`: SMTP configuration (used by `smtp`, and host/port for mailpit capture)
- `FRONTEND_URL`: Frontend URL
- `ALLOW_ADMIN_SIGNUP`: Keep `false` by default; temporary bootstrap only
- `ADMIN_SIGNUP_TOKEN`: Optional bootstrap token for admin signup endpoint
- `ENABLE_TEST_EMAIL`: Keep `false` unless explicitly testing admin-only test endpoint
- `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET`, `SALESFORCE_REDIRECT_URI`: Salesforce OAuth Connected App config
- `SALESFORCE_STATUS_FIELD`, `SALESFORCE_ALLOWED_STATUSES`, `SALESFORCE_DOMAIN_FIELD`: Customer status -> organization access mapping
- `DOCUMENT_UPLOADS_ENABLED`: Global kill switch for document upload/replace endpoints
- `DOCUMENT_UPLOAD_ADMIN_EMAIL_ALLOWLIST`: Optional comma-separated list of admin emails allowed to upload documents
- `DOCUMENT_UPLOADS_PER_MINUTE`: Per-admin upload rate limit to reduce abuse
- `DOCUMENT_UPLOAD_MAX_MB`: Max document upload size in MB
- `DEMO_ALLOW_DOCUMENT_UPLOADS`: Explicitly allow uploads in demo mode (defaults to false)

## Salesforce Integration

The project now includes an admin integration for Salesforce using OAuth 2.0 Connected Apps.

### Why OAuth instead of API key
- Salesforce does not provide a durable "API key only" integration for this workflow
- OAuth with refresh tokens is the standard, secure, long-lived approach
- Supports secure token rotation and revocation

### Flow
1. Admin saves Salesforce credentials in `Admin -> Integrations`
2. Admin calls `GET /api/admin/integrations/salesforce/connect-url`
3. Admin authorizes in Salesforce
4. Salesforce redirects to `SALESFORCE_REDIRECT_URI`
5. Backend stores active Salesforce connection
6. Admin runs `POST /api/admin/integrations/salesforce/sync`

### Sync behavior
- Pulls `Account` and `Contact` records from Salesforce
- Maps accounts to Trust Center organizations using related `Contact` email domains (domain-based access)
- Requires at least one related Contact with a usable business email domain per Account
- Accounts without related Contact email domains are skipped (they do not update/create organizations)
- Uses account status field (`SALESFORCE_STATUS_FIELD`, default `Type`)
- If status is in `SALESFORCE_ALLOWED_STATUSES`, organization is set to `whitelisted`
- Otherwise organization is set to `no_access`
- Admin Integrations page shows connected Salesforce user/org identity and sync audit logs for debugging

Important:
- `Contacts Queried (Org-wide)` is org-wide for the connected user and can be much higher than account count
- Current access mapping uses Contact email domains, not `Account.Website` fallback

Guides:
- Customer admin onboarding (short): `docs/SALESFORCE_ONBOARDING_ADMIN.md`
- Full technical setup + troubleshooting: `docs/SALESFORCE_SETUP.md`

> [!WARNING]
> The default JWT secret and Supabase keys in `docker-compose.yml` are **development-only demo values**.
> For production, you **must** set unique secrets via `.env` or a secrets manager.
> Never use the default keys in any environment accessible from the internet.

## Development

### Hot Reload

Both frontend and backend support hot reload:
- Frontend: Changes to `frontend/src` automatically reload
- Backend: Changes to `backend/src` automatically reload via nodemon

### Running Migrations

Migrations run automatically on container startup. To run manually:

```bash
docker-compose exec supabase-db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/001_initial_schema.sql
```

### Database Access

```bash
docker-compose exec supabase-db psql -U postgres -d postgres
```

### Running Tests

```bash
# Run backend tests
cd backend && npm test

# Run tests in watch mode
cd backend && npm run test:watch
```

Tests cover: auth middleware, rate limiting, magic link generation, and email validation.

### Rate Limiting

The email rate limiter uses an in-memory store, which is suitable for single-instance deployments.
For horizontal scaling with multiple backend instances, consider replacing with a Redis-backed store
(e.g., `express-rate-limit` with `rate-limit-redis`).

## Operations & Security Checks

Use the operational scripts for fast validation and incident triage:

```bash
# End-to-end smoke checks (HTTP + DNS + TLS)
./scripts/ops-smoke-test.sh

# Container log triage
./scripts/log-triage.sh --since 30m

# API contract smoke checks (requires hurl)
./scripts/run-api-smoke.sh

# Backup and restore verification drill
./scripts/db-backup.sh
./scripts/db-restore-verify.sh backups/<backup-file>.dump

# Targeted DNS/TCP/HTTP/TLS diagnostics
./scripts/network-debug.sh localhost 4000 http
```

Detailed runbook: [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md)

CI security scans (Trivy) run on push/PR via:
- `.github/workflows/security-scan.yml`

Deployed API smoke tests (Hurl) run via:
- `.github/workflows/api-smoke-deployed.yml` (manual + scheduled)
- Configure target with workflow input `api_url` or repo variable/secret `SMOKE_API_URL`

## API Endpoints

### Public Endpoints

- `GET /api/documents` - List published documents
- `GET /api/certifications` - List active certifications
- `GET /api/security-updates` - List published security updates
- `GET /api/settings` - Get trust center settings
- `POST /api/document-requests` - Submit document request
- `POST /api/contact` - Submit contact form
- `GET /api/access/:token` - Validate magic link
- `GET /api/access/:token/download/:document_id` - Download via magic link

### Admin Endpoints (Require Authentication)

- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/document-requests` - List all requests
- `PATCH /api/admin/document-requests/:id/approve` - Approve request
- `PATCH /api/admin/document-requests/:id/deny` - Deny request
- `POST /api/documents` - Upload document
- `GET /api/organizations` - List organizations
- `PATCH /api/admin/settings` - Update trust center settings
- `GET /api/admin/integrations/salesforce/status` - Salesforce integration status
- `GET /api/admin/integrations/salesforce/config` - Read Salesforce integration config (admin)
- `PUT /api/admin/integrations/salesforce/config` - Save Salesforce integration config (admin)
- `GET /api/admin/integrations/salesforce/connect-url` - Generate Salesforce OAuth URL
- `POST /api/admin/integrations/salesforce/sync` - Sync Salesforce customer data to organizations

See the plan document for complete API documentation.

## How It Works

### Document Request Flow

1. User browses documents and clicks "Request Access"
2. User fills out form (name, email, company, reason)
3. System extracts email domain and checks organization
4. **If organization has approved documents**: Auto-approve, send magic link instantly
5. **If organization not approved**: Send to admin queue
6. Admin reviews and approves → Documents added to org's approved list
7. Magic link sent via email with time-limited access (7 days)

### Organization Whitelisting

- Each organization tracks which documents they've been approved for
- First request from an org → Admin reviews
- Admin approves → Documents added to org's approved list
- Future requests for same documents → Auto-approved instantly
- New documents → Still require admin approval

## Security

- **4-Layer Protection**: Database RLS, API middleware, Frontend routes, Storage policies
- **Admin-Only Operations**: All admin actions require JWT authentication
- **Magic Link Security**: 256-bit random tokens, time-limited, email-verified
- **Audit Logging**: All admin actions tracked for compliance

## Deployment

### Production Considerations

1. **Environment Variables**: Set all production values in `.env`
2. **HTTPS**: Use reverse proxy (nginx/traefik) for HTTPS
3. **Database**: Use managed PostgreSQL or Supabase Cloud
4. **Storage**: Configure Supabase Storage for production
5. **Email**: Configure production email delivery provider
   - Recommended for this project: `EMAIL_PROVIDER=resend`
   - Keep `EMAIL_PROVIDER=mailpit` in local/dev
6. **Secrets**: Use secret management (Docker secrets, Kubernetes secrets, etc.)
7. **Rate Limiting**: For multi-instance deployments, replace in-memory rate limiter with Redis

### Docker Production Build

The production compose file (`docker-compose.prod.yml`) builds optimized images for both services.
The frontend uses a multi-stage build (deps → build → standalone Next.js) for minimal image size.

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Run production stack
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

See `deployment/kubernetes/` for Kubernetes manifests (create if needed).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the **[MIT License](LICENSE)** — you're free to use, modify, and distribute it for any purpose.

See the [LICENSE](LICENSE) file for full details.

## Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/) with project-specific coding standards. Please read our **[Code of Conduct](CODE_OF_CONDUCT.md)** before contributing.

Key expectations:
- Follow TypeScript/React best practices and existing codebase conventions
- Write clean, secure, and accessible code
- Keep PRs focused and ensure `npm run build` passes
- Report security vulnerabilities privately — never in public issues

## Support

For issues and questions:
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/kutcode/trust-center/issues)
- 💡 **Feature Requests**: [GitHub Issues](https://github.com/kutcode/trust-center/issues)
- 📖 **Documentation**: [docs/](docs/)

## Roadmap

- [ ] Email template customization
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Redis-backed rate limiting for horizontal scaling
- [ ] OpenAPI/Swagger documentation
- [ ] Advanced document versioning UI
- [ ] Frontend test coverage (React Testing Library)
