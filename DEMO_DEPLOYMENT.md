# 🚀 Live Demo Deployment Guide

Deploy a public demo instance of the Trust Center so users can explore features without local setup.

## Prerequisites

- A [Railway](https://railway.app) account (free tier works)
- Git repository pushed to GitHub
- The `feature/live-demo` branch

## Architecture

The demo runs a streamlined version of the stack:

| Service | Purpose |
|---------|---------|
| `supabase-db` | PostgreSQL database |
| `supabase-auth` | Authentication (GoTrue) |
| `supabase-kong` | API gateway |
| `supabase-rest` | PostgREST for DB queries |
| `supabase-meta` | Postgres metadata |
| `backend` | Express API server |
| `frontend` | Next.js web app |
| `demo-reset` | Hourly database reset |

**Excluded from demo:** pgAdmin, Mailpit, Supabase Studio (not needed for public demo).

## Deploy to Railway

### 1. Create Railway Project

```bash
# Install Railway CLI (if needed)
npm install -g @railway/cli

# Login
railway login

# Create project
railway init
```

### 2. Configure Environment Variables

Set these in Railway's dashboard or via CLI:

```env
# Demo Mode
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_EMAIL=demo@trustcenter.io
NEXT_PUBLIC_DEMO_PASSWORD=demo1234

# Supabase (these use the default demo keys)
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# URLs (update with your Railway URLs after deployment)
DEMO_FRONTEND_URL=https://your-app.up.railway.app
DEMO_API_URL=https://your-api.up.railway.app
DEMO_SUPABASE_URL=https://your-supabase.up.railway.app
```

### 3. Deploy with Docker Compose

```bash
# Use the demo overlay
docker-compose -f docker-compose.yml -f docker-compose.demo.yml up --build -d
```

### 4. Create Demo Admin User

After the stack is running, create the demo admin:

```bash
# Connect to the auth service and create the demo user
curl -X POST http://localhost:9999/admin/users \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@trustcenter.io",
    "password": "demo1234",
    "email_confirm": true,
    "user_metadata": {"full_name": "Demo Admin"}
  }'

# Then add to admin_users table
docker exec trust-center-db psql -U postgres -c "
  INSERT INTO admin_users (id, email, full_name, role)
  SELECT id, email, raw_user_meta_data->>'full_name', 'admin'
  FROM auth.users
  WHERE email = 'demo@trustcenter.io'
  ON CONFLICT (id) DO NOTHING;
"
```

### 5. Custom Domain (Optional)

In Railway dashboard → Settings → Domains, add your custom domain (e.g., `demo.trustcenter.dev`).

## Local Testing

Test the demo setup locally before deploying:

```bash
# Start demo stack
docker-compose -f docker-compose.yml -f docker-compose.demo.yml up --build

# Visit:
# - Public site: http://localhost:3000
# - Admin panel: http://localhost:3000/admin/login
# - Demo banner should appear at top of every page
```

## Monitoring

- **Demo reset logs:** `docker logs trust-center-demo-reset -f`
- **Backend logs:** `docker logs trust-center-backend -f`
- **Frontend logs:** `docker logs trust-center-frontend -f`

## How Demo Mode Works

| Feature | Behavior |
|---------|----------|
| **Email** | All emails are silently mocked (no real delivery) |
| **Signup** | Disabled — only pre-created demo admin can log in |
| **Data** | Resets to clean sample state every hour |
| **Banner** | Persistent banner on all pages linking to GitHub |
| **Admin** | Full admin panel access with demo credentials |
