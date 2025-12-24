# Quick Start Guide

## First Time Setup

1. **Start the application**
   ```bash
   docker-compose up
   ```
   Wait for all services to start (this may take a few minutes on first run).

2. **Create your first admin user**
   
   Option A: Via Supabase Studio (Recommended)
   - Open http://localhost:54323
   - Go to Authentication → Users → Add User
   - Enter email and password
   - Copy the User ID
   - Go to SQL Editor and run:
     ```sql
     INSERT INTO admin_users (id, email, full_name, role)
     SELECT id, email, 'Admin User', 'admin' 
     FROM auth.users 
     WHERE email = 'your-email@example.com';
     ```

   Option B: Via Script
   ```bash
   ./scripts/create-admin.sh admin@example.com password123 "Admin User"
   ```

3. **Login to Admin Console**
   - Go to http://localhost:3000/admin/login
   - Use your admin credentials

4. **Upload your first document**
   - Navigate to Admin → Documents → Upload New Document
   - Fill out the form and upload a PDF

5. **Test document request flow**
   - Go to http://localhost:3000/documents
   - Click "Request Access" on a restricted document
   - Fill out the request form
   - Check admin console to approve
   - Check email for magic link (if SMTP configured)

## Default Credentials

For local development, Supabase uses these defaults:
- Database: `postgres` / `postgres`
- Anon Key: See `.env.example`
- Service Key: See `.env.example`

## Troubleshooting

**Port already in use:**
- Change ports in `docker-compose.yml`
- Or stop conflicting services

**Database connection errors:**
- Wait for Supabase to fully initialize (check logs)
- Ensure migrations ran successfully

**Admin login not working:**
- Verify user exists in `admin_users` table
- Check Supabase Auth user was created
- Verify email/password are correct

**Magic links not sending:**
- Configure SMTP settings in `.env`
- Check email service logs
- For testing, check Supabase logs

## Next Steps

- Customize trust center settings in Admin → Settings
- Upload compliance documents
- Configure email templates
- Set up production deployment

For detailed documentation, see [README.md](./README.md).

