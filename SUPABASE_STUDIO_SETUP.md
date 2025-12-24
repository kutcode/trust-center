# Supabase Studio Setup Guide

## Current Status
✅ All services are running:
- Database: Running
- PostgREST: Running  
- Postgres Meta: Running (healthy)
- Storage: Running
- Auth: Running
- Studio: Running

## Access Supabase Studio

1. **Open in browser**: http://localhost:54323

2. **If you see "Connecting to Default Project":**
   - Wait 10-15 seconds for Studio to initialize
   - Check browser console (F12) for any errors
   - Try refreshing the page

3. **If Studio shows an error:**
   - Check the logs: `docker logs trust-center-studio --tail 50`
   - Verify all services are running: `docker ps`

## Verify Services Are Working

Run these commands to verify everything is connected:

```bash
# Check PostgREST API
curl http://localhost:8000/rest/v1/ \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Check Auth API  
curl http://localhost:8000/auth/v1/health

# Check Storage API
curl http://localhost:5001/health
```

## If Studio Still Doesn't Work

### Option 1: Check Browser Console
1. Open http://localhost:54323
2. Press F12 to open developer tools
3. Go to Console tab
4. Look for any red error messages
5. Share those errors for troubleshooting

### Option 2: Use pgAdmin Instead
pgAdmin is simpler and already working:
- URL: http://localhost:5050
- Email: `admin@admin.com`
- Password: `admin`

### Option 3: Direct Database Access
You can always use direct SQL:
```bash
docker exec -it trust-center-db psql -U postgres -d postgres
```

## Configuration

Studio is configured with:
- **SUPABASE_URL**: http://localhost:8000 (for browser)
- **STUDIO_PG_META_URL**: http://supabase-meta:8080 (internal)
- **STUDIO_API_URL**: http://localhost:8000
- **Default Project**: default
- **Default Organization**: default

## Troubleshooting Commands

```bash
# View Studio logs
docker logs trust-center-studio --tail 100

# Restart Studio
docker-compose restart supabase-studio

# Recreate Studio with fresh config
docker-compose stop supabase-studio
docker-compose rm -f supabase-studio
docker-compose up -d supabase-studio

# Check all service status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

