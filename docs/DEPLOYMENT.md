# Trust Center Public Deployment Guide

This guide covers deploying Trust Center to various cloud platforms for public access.

## Quick Start

### Option 1: Railway (Recommended)

Railway offers the easiest deployment experience with automatic builds from GitHub.

#### Prerequisites
- [Railway account](https://railway.app)
- GitHub repository connected to Railway
- Supabase project (or Railway PostgreSQL)

#### Steps

1. **Create a new Railway project**
   ```bash
   # Install Railway CLI (optional)
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy from GitHub**
   - Go to Railway Dashboard → New Project → Deploy from GitHub
   - Select your Trust Center repository
   - Railway will detect the Dockerfiles automatically

3. **Add PostgreSQL** (if not using Supabase)
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically inject `DATABASE_URL`

4. **Configure Environment Variables**
   
   For the **backend** service:
   ```
   NODE_ENV=production
   PORT=4000
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_KEY=<your-supabase-service-key>
   JWT_SECRET=<generate-32-char-secret>
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=<your-resend-api-key>
   SMTP_FROM=noreply@yourdomain.com
   FRONTEND_URL=https://your-frontend.railway.app
   ```

   For the **frontend** service:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```

5. **Generate Domain**
   - Click on your service → Settings → Generate Domain

---

### Option 2: Render

Render provides a simple platform with free tier support.

#### Using render.yaml Blueprint

1. Fork the repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will detect `render.yaml` and configure services automatically
6. Fill in the environment variables when prompted

#### Manual Setup

1. **Create Backend Service**
   - New → Web Service → Connect Repository
   - Root Directory: `./backend`
   - Docker runtime
   - Set environment variables (see Railway section)

2. **Create Frontend Service**
   - New → Web Service → Connect Repository
   - Root Directory: `./frontend`
   - Docker runtime
   - Build Args: Set `NEXT_PUBLIC_*` variables

---

### Option 3: Self-Hosted with Docker Compose

For VPS or bare-metal deployments.

#### Prerequisites
- Docker and Docker Compose installed
- Domain name with DNS configured
- SSL certificate (use Caddy or nginx-proxy)

#### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/kutcode/trust-center.git
   cd trust-center
   ```

2. **Create production environment file**
   ```bash
   cp .env.example .env.production
   ```

3. **Edit `.env.production`**
   ```env
   NODE_ENV=production
   
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   DATABASE_URL=postgresql://user:password@host:5432/database
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
   
   # Public URLs
   FRONTEND_URL=https://trust.yourdomain.com
   NEXT_PUBLIC_API_URL=https://api.trust.yourdomain.com
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   
   # Email
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_your_api_key
   SMTP_FROM=noreply@yourdomain.com
   ```

4. **Build and start**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
   ```

5. **Set up reverse proxy** (example with Caddy)
   ```
   # Caddyfile
   trust.yourdomain.com {
       reverse_proxy localhost:3000
   }
   
   api.trust.yourdomain.com {
       reverse_proxy localhost:4000
   }
   ```

---

## Database Setup

### Using Supabase Cloud

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations:
   ```bash
   # Using Supabase CLI
   npx supabase db push --db-url "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
   ```
   
   Or manually import migrations via SQL Editor:
   - Go to SQL Editor in Supabase Dashboard
   - Run each migration file in order

### Using Railway PostgreSQL

Railway automatically provisions PostgreSQL. Run migrations:
```bash
# Connect to Railway database
railway run -- npx supabase db push
```

---

## Supabase Setup

### Creating a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Note down:
   - **Project URL**: `https://xxx.supabase.co`
   - **Anon Key**: Found in Settings → API
   - **Service Role Key**: Found in Settings → API (keep secret!)

### Running Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Creating Admin User

1. Go to Authentication → Users in Supabase Dashboard
2. Click "Add User" → Create with email/password
3. Copy the user's UUID
4. Run SQL:
   ```sql
   INSERT INTO admin_users (id, email, full_name, role)
   VALUES ('user-uuid', 'admin@example.com', 'Admin User', 'admin');
   ```

---

## Demo Mode Setup

To run a public demo with sample data:

1. **Seed Demo Data**
   Run the seed SQL files to populate sample:
   - Certifications
   - Documents
   - Security updates
   - Controls

2. **Optional: Read-Only Mode**
   Add to backend environment:
   ```
   DEMO_MODE=true
   ```
   This can be used to restrict write operations.

3. **Rate Limiting**
   The backend includes rate limiting. Adjust in production:
   ```
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

---

## SSL/HTTPS Setup

### With Caddy (Recommended)

Caddy automatically handles SSL certificates:

```
# docker-compose.prod.yml addition
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
```

### With nginx + Let's Encrypt

Use certbot:
```bash
sudo certbot --nginx -d trust.yourdomain.com -d api.trust.yourdomain.com
```

---

## Monitoring & Logs

### Railway
- View logs in Railway dashboard
- Set up log drains for external services

### Render
- View logs in service dashboard
- Enable log streams for external services

### Self-Hosted
```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## Troubleshooting

### Common Issues

**1. CORS Errors**
Ensure `FRONTEND_URL` is set correctly in backend environment.

**2. Database Connection Failures**
- Verify `DATABASE_URL` format
- Check network/firewall rules
- Ensure SSL mode is correct for Supabase: `?sslmode=require`

**3. Email Not Sending**
- Verify `EMAIL_PROVIDER` and API keys
- Check sender domain verification in Resend/SendGrid

**4. Image Upload Failures**
- Ensure persistent volume is mounted
- Check directory permissions

### Health Checks

```bash
# Backend health
curl https://your-api-url/health

# Should return:
# {"status":"ok","timestamp":"2024-..."}
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` or `development` |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `JWT_SECRET` | Yes | 32+ character secret for JWT signing |
| `EMAIL_PROVIDER` | Yes | `resend`, `sendgrid`, or `smtp` |
| `RESEND_API_KEY` | If using Resend | Resend API key |
| `SENDGRID_API_KEY` | If using SendGrid | SendGrid API key |
| `SMTP_FROM` | Yes | Sender email address |
| `FRONTEND_URL` | Yes | Public frontend URL |
| `NEXT_PUBLIC_API_URL` | Yes | Public backend API URL |
