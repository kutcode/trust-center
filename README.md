# Trust Center

An open-source security trust center platform similar to Plaid's trust center. Built with Next.js 15, Docker, and Supabase, featuring organization-level document approval, magic link access, and comprehensive admin management.

## Features

- **Public Security Documentation**: Display compliance certifications, security updates, and public documents
- **Document Request System**: Users can request access to restricted documents without creating accounts
- **Magic Link Access**: Time-limited access links sent via email (Plaid-style, no login required)
- **Organization Whitelisting**: Track approved documents per organization for granular access control
- **Auto-Approval**: Organizations with previously approved documents get instant access
- **Admin Console**: Full-featured admin panel for document management, request approval, and customization
- **Trust Center Customization**: Customize branding, colors, hero section, and content
- **Multi-Layer Security**: Role-based access control with database, API, frontend, and storage protection

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth (admin-only), Magic links for document access
- **Storage**: Supabase Storage
- **Containerization**: Docker + Docker Compose
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

The Trust Center uses **Resend** for secure, production-ready email delivery with high deliverability to Gmail, Hotmail, Yahoo, and other major providers.

### Quick Setup

1. **For Development** (emails captured locally):
   - No configuration needed! Emails are automatically captured by Mailpit
   - View emails at http://localhost:8025

2. **For Production** (real email delivery):
   - Sign up at [Resend.com](https://resend.com) (free tier: 3,000 emails/month)
   - Get your API key from the dashboard
   - Add to `.env`:
     ```env
     EMAIL_PROVIDER=resend
     RESEND_API_KEY=re_your_api_key_here
     SMTP_FROM=noreply@yourdomain.com
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
├── docker-compose.yml          # Docker Compose configuration
├── frontend/                   # Next.js frontend application
│   ├── src/
│   │   ├── app/               # App router pages
│   │   ├── components/        # React components
│   │   ├── lib/              # Utilities and Supabase clients
│   │   └── types/             # TypeScript types
│   └── Dockerfile.dev         # Development Dockerfile
├── backend/                    # Express backend API
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── middleware/       # Auth and error middleware
│   │   └── utils/            # Utility functions
│   └── Dockerfile.dev         # Development Dockerfile
└── supabase/                  # Supabase configuration
    ├── migrations/            # Database migrations
    ├── config.toml           # Supabase local config
    └── kong.yml              # Kong API gateway config
```

## Environment Variables

See `.env.example` for all available environment variables:

- `JWT_SECRET`: Secret for JWT tokens
- `ANON_KEY`: Supabase anonymous key
- `SERVICE_KEY`: Supabase service role key
- `SMTP_*`: Email configuration for magic links
- `FRONTEND_URL`: Frontend URL
- `BACKEND_URL`: Backend API URL

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
5. **Email**: Configure SMTP for production email delivery
6. **Secrets**: Use secret management (Docker secrets, Kubernetes secrets, etc.)

### Docker Production Build

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

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/kutcode/trust-center/issues
- Email: security@example.com

## Roadmap

- [ ] Email template customization
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] API rate limiting improvements
- [ ] Webhook support for integrations
- [ ] Advanced document versioning UI

