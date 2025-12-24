# pgAdmin Setup Guide

## Access pgAdmin
**URL**: http://localhost:5050

## Login Credentials
When you first access pgAdmin, you'll see a login form:
- **Email Address**: `admin@admin.com`
- **Password**: `admin`

If you don't see a login screen, you might already be logged in (check the top right corner for your email).

## Connect to Your Database

### Step 1: Register a New Server
1. In the left sidebar, find **"Servers"**
2. Right-click on **"Servers"** → **"Register"** → **"Server..."**

### Step 2: General Tab
- **Name**: `Trust Center DB` (or any name you prefer)

### Step 3: Connection Tab
Fill in these details:
- **Host name/address**: `trust-center-db` 
  - (Use `localhost` if connecting from your Mac, not from Docker)
- **Port**: `5432`
- **Maintenance database**: `postgres`
- **Username**: `postgres`
- **Password**: `postgres`
- ✅ Check **"Save password"** (optional, for convenience)

### Step 4: Save
Click the **"Save"** button at the bottom

## After Connecting

You should now see:
- **Trust Center DB** in the left sidebar under Servers
- Expand it to see:
  - Databases → postgres
  - Schemas → public, auth, storage, extensions
  - Tables → All your application tables

## Quick Access to Tables

1. Expand: **Servers** → **Trust Center DB** → **Databases** → **postgres** → **Schemas** → **public** → **Tables**
2. You'll see all your tables:
   - `organizations`
   - `admin_users`
   - `documents`
   - `document_requests`
   - etc.

## Run SQL Queries

1. Right-click on **"postgres"** database → **"Query Tool"**
2. Type your SQL and click the play button (▶️) or press F5

## Troubleshooting

**Can't connect?**
- Make sure `trust-center-db` container is running: `docker ps | grep db`
- Try using `localhost` instead of `trust-center-db` in the host field
- Check the port is `5432`

**Don't see login screen?**
- Clear browser cache and cookies for localhost:5050
- Try incognito/private browsing mode
- Check if you're already logged in (look for email in top right)

