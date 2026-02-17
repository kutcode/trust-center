# 🚀 Live Demo Deployment Guide

Deploy the Trust Center demo using **Supabase Cloud** (database + auth) and **Railway** (backend + frontend).

## Architecture

```
┌──────────────────┐     ┌──────────────────┐
│  Railway Service  │     │  Railway Service  │
│    (Backend)      │◄───►│    (Frontend)     │
│  Express API      │     │  Next.js App      │
└────────┬─────────┘     └──────────────────┘
         │
         ▼
┌──────────────────┐
│  Supabase Cloud   │
│  (Free Tier)      │
│  - PostgreSQL     │
│  - Auth (GoTrue)  │
│  - Storage        │
└──────────────────┘
```

## Step 1: Create Supabase Cloud Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project — pick any name and set a database password
3. Wait for it to provision (~2 minutes)
4. From **Project Settings → API**, copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key**
   - **service_role secret key**

5. Run the migrations against your Supabase DB. Go to **SQL Editor** in the Supabase dashboard and paste + run each migration file from `supabase/migrations/` **in order** (000 through 021).

6. Create the demo admin user:
   - Go to **Authentication → Users → Add User**
   - Email: `demo@trustcenter.io`, Password: `demo123`
   - Copy the user UUID
   - In **SQL Editor**, run:
     ```sql
     INSERT INTO admin_users (id, email, full_name, role)
     VALUES ('<user-uuid>', 'demo@trustcenter.io', 'Demo Admin', 'admin');
     ```

7. Run the demo seed data — paste the INSERT statements from `scripts/reset-demo.sh` (the SQL section) into the SQL Editor.

## Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and connect your GitHub repo
2. Click **New Service → GitHub Repo → trust-center**
3. **Important:** In the service settings:
   - Set **Root Directory** to `/backend`
   - Railway will detect the `Dockerfile` automatically
4. Add these **environment variables**:

```env
NODE_ENV=production
PORT=4000
DEMO_MODE=true

# From Supabase dashboard
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_KEY=eyJ...your-service-key
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=your-supabase-jwt-secret

# Email (mocked in demo mode, but still needed)
EMAIL_PROVIDER=mailpit
SMTP_FROM=noreply@trustcenter.demo

# CORS — set after frontend deploys
FRONTEND_URL=https://your-frontend.up.railway.app
```

5. Deploy and note the generated URL (e.g., `https://trust-center-backend-production.up.railway.app`)

## Step 3: Deploy Frontend to Railway

1. In the same Railway project, click **New Service → GitHub Repo → trust-center**
2. **Important:** In the service settings:
   - Set **Root Directory** to `/frontend`
   - Railway will detect the `Dockerfile` automatically
3. Add these **environment variables**:

```env
NODE_ENV=production
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_EMAIL=demo@trustcenter.io
NEXT_PUBLIC_DEMO_PASSWORD=demo123

# Backend URL from Step 2
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
API_URL=https://your-backend.up.railway.app

# Supabase (public keys only)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

4. Deploy and note the generated URL

## Step 4: Update CORS

Go back to the **backend** service in Railway and update:
```env
FRONTEND_URL=https://your-frontend.up.railway.app
```

Redeploy the backend.

## Step 5: Custom Domain (Optional)

In Railway:
1. Go to your frontend service → Settings → Networking → Custom Domain
2. Add `demo.trustcenter.dev` (or your choice)
3. Configure DNS as instructed

## Verification

- Visit the frontend URL — you should see the demo banner
- Click "Try Admin Panel" → login page should pre-fill credentials
- Click "Login as Demo Admin" → should enter the admin dashboard
- Browse documents, certifications, settings — all sample data visible

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Make sure `FRONTEND_URL` in backend matches frontend URL exactly |
| Auth failures | Verify `SUPABASE_URL` and keys match your Supabase project |
| 404 on API calls | Check `NEXT_PUBLIC_API_URL` points to backend Railway URL |
| Build fails | Check Railway logs — make sure root directory is set correctly |
