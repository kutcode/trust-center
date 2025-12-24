# Trust Center - Setup Complete ✅

Your Trust Center application is now fully configured and working!

## 🔑 Key Fixes Applied

1. **JWT Secret Fixed** - Updated all services to use the correct JWT secret (`super-secret-jwt-token-with-at-least-32-characters-long`)
2. **Kong Gateway Configured** - Fixed service_role key in Kong configuration
3. **Database Permissions Granted** - All roles (anon, authenticated, service_role) now have correct permissions
4. **RLS Policies Fixed** - Removed recursive policies that caused infinite loops
5. **GoTrue Auth Working** - User creation and login now functional

## 🌐 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main Trust Center site |
| **Admin Panel** | http://localhost:3000/admin/login | Admin console |
| **Backend API** | http://localhost:4000 | REST API |
| **Supabase Studio** | http://localhost:54323 | Database UI (may be unstable) |
| **pgAdmin** | http://localhost:5050 | Alternative DB admin |
| **Kong Gateway** | http://localhost:8000 | API Gateway |

## 👤 Admin Credentials

Use these to login to the admin panel:

| Email | Password |
|-------|----------|
| `admin2@example.com` | `admin123` |
| `newadmin@example.com` | `newadmin123` |

## 🚀 Creating New Admin Users

### Method 1: Via GoTrue Admin API (Recommended)

```bash
# Create the auth user
curl -X POST 'http://localhost:9999/admin/users' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword","email_confirm":true,"user_metadata":{"full_name":"Your Name"}}'
```

Then add to admin_users table:
```bash
docker exec -it trust-center-db psql -U postgres -d postgres -c "
INSERT INTO admin_users (id, email, full_name, role)
VALUES ('<user-id-from-response>', 'your@email.com', 'Your Name', 'admin');
"
```

### Method 2: Via SQL (Direct)

```bash
docker exec -it trust-center-db psql -U postgres -d postgres
```

Then run:
```sql
-- Create auth user
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, 
  created_at, updated_at, raw_user_meta_data, aud, role
)
VALUES (
  gen_random_uuid(),
  'your@email.com',
  crypt('yourpassword', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"full_name": "Your Name"}'::jsonb,
  'authenticated',
  'authenticated'
)
RETURNING id;

-- Create identity (required for login)
INSERT INTO auth.identities (id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
SELECT gen_random_uuid(), id, jsonb_build_object('sub', id::text, 'email', email), 'email', NOW(), NOW(), NOW()
FROM auth.users WHERE email = 'your@email.com';

-- Add to admin_users
INSERT INTO admin_users (id, email, full_name, role)
SELECT id, email, 'Your Name', 'admin'
FROM auth.users WHERE email = 'your@email.com';
```

## 📋 Feature Checklist

### ✅ Implemented

- [x] Public Trust Center homepage
- [x] Document browsing (public and restricted)
- [x] Document request flow
- [x] Admin authentication (login/logout)
- [x] Admin dashboard
- [x] User management (create/delete/toggle admin)
- [x] Organization management
- [x] Document upload and management
- [x] Trust Center settings customization
- [x] Security updates and certifications pages
- [x] Contact form
- [x] Magic link document access

### 🔧 Workflow

1. **Visitor Flow:**
   - Visit http://localhost:3000
   - Browse public documents
   - Request access to restricted documents
   - Receive magic link via email when approved

2. **Admin Flow:**
   - Login at http://localhost:3000/admin/login
   - Review document requests
   - Approve/deny with notes
   - Upload new documents
   - Manage organizations (whitelist domains)
   - Customize Trust Center appearance

## 🗄️ Database Access

### pgAdmin (Recommended)
1. Open http://localhost:5050
2. Login: `admin@admin.com` / `admin`
3. Add server:
   - Host: `trust-center-db`
   - Port: `5432`
   - Database: `postgres`
   - Username: `postgres`
   - Password: `postgres`

### Direct psql
```bash
docker exec -it trust-center-db psql -U postgres -d postgres
```

## 🔧 Troubleshooting

### Backend Not Starting
```bash
docker logs trust-center-backend --tail 50
docker restart trust-center-backend
```

### Database Permission Errors
```bash
docker exec trust-center-db psql -U postgres -d postgres -c "
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
"
docker restart trust-center-rest
```

### Login Not Working
1. Verify user exists: `SELECT email FROM auth.users;`
2. Verify admin status: `SELECT email FROM admin_users;`
3. Check identity exists: `SELECT user_id FROM auth.identities;`

### Reset Everything
```bash
docker-compose down -v
docker-compose up -d
```

## 📁 Project Structure

```
/
├── frontend/          # Next.js 15 frontend
│   └── src/
│       ├── app/       # App router pages
│       ├── components/
│       └── lib/       # Supabase clients, API helpers
├── backend/           # Express.js API
│   └── src/
│       ├── routes/    # API endpoints
│       ├── middleware/
│       └── utils/
├── supabase/
│   ├── migrations/    # Database schema
│   └── kong.yml       # API gateway config
└── docker-compose.yml
```

## 🔐 Environment Variables

The following JWT tokens are pre-configured:

- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
- **Service Role Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`
- **JWT Secret:** `super-secret-jwt-token-with-at-least-32-characters-long`

**⚠️ For production, generate new keys!**
