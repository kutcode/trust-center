# Railway Deployment Guide for Trust Center

This is a step-by-step guide to deploy Trust Center on Railway.

## Prerequisites

- GitHub account (connected to Railway)
- Railway account ([railway.app](https://railway.app))
- Supabase account for authentication ([supabase.com](https://supabase.com))
- Resend account for email ([resend.com](https://resend.com)) - optional for demo

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `trust-center` (or your choice)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### Get Your Supabase Credentials

Once created, go to **Settings → API** and note:

| Credential | Where to Find |
|------------|---------------|
| Project URL | `https://xxxxx.supabase.co` |
| anon public key | Under "Project API keys" |
| service_role key | Under "Project API keys" (keep secret!) |

### Run Database Migrations

Option A: **Using Supabase SQL Editor**
1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and run each migration file in order:
   - `000_auth_schema.sql`
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - ... through `021_admin_nav_order.sql`

Option B: **Using Supabase CLI**
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### Create Admin User

1. Go to **Authentication → Users → Add User**
2. Create user with email/password
3. Copy the user's UUID
4. Run this SQL in SQL Editor:
```sql
INSERT INTO admin_users (id, email, full_name, role)
VALUES ('YOUR-USER-UUID', 'your-email@example.com', 'Admin', 'admin');
```

---

## Step 2: Deploy on Railway

### 2.1 Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select **`kutcode/trust-center`**
6. Choose branch: **`test/example-contribution`**

### 2.2 Configure Backend Service

Railway may auto-detect your project. If not, or to add manually:

1. In your project, click **"New"** → **"GitHub Repo"**
2. Select your trust-center repo
3. Click on the service card → **Settings**:
   - **Root Directory**: `backend`
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `Dockerfile` (relative to root directory)

4. Go to **Variables** tab and add:

```
NODE_ENV=production
PORT=4000

# Supabase Configuration
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...YOUR_ANON_KEY
SUPABASE_SERVICE_KEY=eyJhbGc...YOUR_SERVICE_KEY

# JWT Secret (generate a random 32+ character string)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Email Configuration (optional for demo)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_YOUR_RESEND_API_KEY
SMTP_FROM=noreply@yourdomain.com

# Frontend URL (update after frontend is deployed)
FRONTEND_URL=https://your-frontend.railway.app
```

5. Go to **Settings** → **Networking** → **Generate Domain**
   - Note this URL (e.g., `trust-center-backend-production.up.railway.app`)

### 2.3 Configure Frontend Service

1. Click **"New"** → **"GitHub Repo"** → Select trust-center again
2. Click on the service card → **Settings**:
   - **Root Directory**: `frontend`
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `Dockerfile`

3. Go to **Variables** tab and add:

```
NODE_ENV=production

# Supabase (same as backend)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...YOUR_ANON_KEY

# Backend API URL (use the URL from step 2.2)
NEXT_PUBLIC_API_URL=https://trust-center-backend-production.up.railway.app
API_URL=https://trust-center-backend-production.up.railway.app
```

4. Go to **Settings** → **Networking** → **Generate Domain**
   - This is your public demo URL!

### 2.4 Update Backend with Frontend URL

Go back to your **backend service** → **Variables** and update:
```
FRONTEND_URL=https://your-frontend-url.railway.app
```

---

## Step 3: Verify Deployment

### Check Backend Health
```bash
curl https://your-backend-url.railway.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Check Frontend
Visit your frontend URL in browser - you should see the Trust Center homepage!

### Test Admin Login
1. Go to `https://your-frontend-url.railway.app/admin`
2. Log in with the admin credentials you created in Supabase

---

## Environment Variables Reference

### Backend Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `4000` |
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `JWT_SECRET` | Yes | 32+ character secret string |
| `EMAIL_PROVIDER` | No | `resend`, `sendgrid`, or `smtp` |
| `RESEND_API_KEY` | If using Resend | Your Resend API key |
| `SMTP_FROM` | Yes | Sender email address |
| `FRONTEND_URL` | Yes | Your frontend's public URL |

### Frontend Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `NEXT_PUBLIC_API_URL` | Yes | Your backend's public URL |
| `API_URL` | Yes | Same as above (for SSR) |

---

## Troubleshooting

### Build Fails

**Check the build logs** in Railway for specific errors.

Common issues:
- Missing environment variables
- Wrong root directory path
- Dockerfile not found

### CORS Errors

Ensure `FRONTEND_URL` in backend matches your actual frontend URL exactly.

### Database Connection Errors

- Verify Supabase URL and keys are correct
- Check that migrations were run successfully
- Ensure the service role key (not anon key) is used for `SUPABASE_SERVICE_KEY`

### Emails Not Sending

For demo purposes, you can skip email setup. Emails will fail silently but the app will still work.

To enable emails:
1. Sign up at [resend.com](https://resend.com)
2. Get API key
3. Add `RESEND_API_KEY` to backend variables

---

## Demo Data

To add sample data for your demo:

1. Go to Supabase SQL Editor
2. Run the seed data migration: `004_seed_data.sql`
3. For controls, run: `018_seed_plaid_categories.sql`

---

## Cost Estimate

### Railway
- **Hobby Plan**: $5/month (enough for demo)
- Includes 512MB RAM per service
- Automatic SSL, custom domains

### Supabase  
- **Free Tier**: 500MB database, 1GB storage
- Sufficient for demo/small production

### Resend
- **Free Tier**: 3,000 emails/month
- Sufficient for demo

**Total for Demo**: ~$5/month (just Railway)
