# Admin Dashboard Guide

## Overview

The Admin Dashboard provides complete control over your Trust Center. Here's what you can do:

## 🏠 Dashboard (Home)

**Location:** `/admin`

**Features:**
- View statistics at a glance:
  - Pending document requests
  - Total organizations
  - Approved organizations
  - Total documents
- Quick action buttons:
  - Upload New Document
  - Review Pending Requests
  - Manage Organizations

## 📄 Documents Management

**Location:** `/admin/documents`

**What you can do:**
- **View all documents** - See all uploaded documents in a table
- **Upload new documents** - Click "Upload New Document" button
- **Edit documents** - Click "Edit" on any document
- **Delete documents** - Click "Delete" on any document
- **Filter by category** - See documents organized by category
- **Set access levels** - Mark documents as "public" or "restricted"

**Document Upload:**
- Supported formats: PDF, DOCX, PNG, JPG (max 50MB)
- Required fields: Title, File
- Optional: Description, Category, Access Level

## 📋 Document Requests

**Location:** `/admin/requests`

**What you can do:**
- **View all requests** - See document access requests from users
- **Filter requests** - Filter by status:
  - All
  - Pending (needs your approval)
  - Approved
  - Denied
- **Approve requests** - Click "Approve" to grant access
- **Deny requests** - Click "Deny" to reject (optional reason)
- **View requester details** - See name, email, company, and requested documents

**Request Flow:**
1. User requests access to restricted documents
2. Request appears in "Pending" filter
3. Admin reviews and approves/denies
4. If approved, user receives magic link via email
5. User can access documents via the link

## 🏢 Organizations

**Location:** `/admin/organizations`

**What you can do:**
- **View all organizations** - See organizations that have requested access
- **See organization details:**
  - Organization name
  - Email domain (e.g., @company.com)
  - Number of approved documents
  - First approval date
- **Organization-level approvals** - When you approve a request, the entire organization gets access

**Organization Whitelisting:**
- Organizations are identified by email domain
- Once approved for specific documents, all users from that domain get automatic access
- Example: If @acme.com is approved for Document A, all @acme.com users can access it

## 👥 User Management

**Location:** `/admin/users`

**What you can do:**
- **View all users** - See all registered users in the system
- **Create new users** - Click "Create User" button
- **Make users admin** - Toggle admin status for any user
- **Delete users** - Remove users from the system
- **View user details:**
  - Email
  - Full name
  - Role (Admin/User)
  - Account status (Confirmed/Pending)
  - Created date

**Creating Users:**
- Required: Email, Password
- Optional: Full Name
- Can set as admin during creation
- Admin role options: "admin" or "super_admin"

## ⚙️ Settings

**Location:** `/admin/settings`

**What you can do:**
- **Customize Trust Center:**
  - Company Name
  - Hero Title (main heading on homepage)
  - Hero Subtitle (description under title)
  - Primary Color (brand color)
  - Secondary Color (accent color)
  - Contact Email
  - About Section (HTML content)
- **Save changes** - Click "Save Settings" to apply

**Customization Tips:**
- Colors are in hex format (e.g., #007bff)
- About section supports HTML
- Changes appear immediately on the public site

## 🔐 Security Features

- **Role-based access** - Only admins can access admin panel
- **Session management** - Automatic logout after inactivity
- **Audit trail** - All admin actions are logged
- **Document versioning** - Upload new versions while keeping old ones

## 📊 Typical Workflow

### 1. Initial Setup
1. Go to **Settings** → Configure your company info and branding
2. Go to **Documents** → Upload your compliance documents
3. Set documents as "public" (anyone can download) or "restricted" (requires approval)

### 2. Daily Operations
1. Check **Dashboard** for pending requests
2. Go to **Requests** → Review and approve/deny requests
3. Monitor **Organizations** to see which companies have access
4. Use **Users** to manage admin accounts

### 3. Adding New Documents
1. Go to **Documents** → Click "Upload New Document"
2. Fill in title, description, category
3. Choose access level (public/restricted)
4. Upload file
5. Document appears in the list

### 4. Handling Requests
1. User requests access via public site
2. Request appears in **Requests** → "Pending" filter
3. Review requester details and requested documents
4. Click "Approve" or "Deny"
5. If approved, organization gets whitelisted for those documents
6. User receives magic link via email

## 🎯 Quick Tips

- **Public Documents**: Anyone can download without approval
- **Restricted Documents**: Require admin approval before access
- **Organization Whitelisting**: Once approved, all users from that domain get access
- **Magic Links**: Approved users receive time-limited access links via email
- **No User Accounts**: Regular users don't need accounts - they just request and get links

## 🚨 Troubleshooting

**Can't see documents?**
- Check if documents are published (status = "published")
- Verify access level is set correctly

**Requests not showing?**
- Check the filter (All/Pending/Approved/Denied)
- Verify backend API is running

**Can't upload documents?**
- Check file size (max 50MB)
- Verify file format (PDF, DOCX, PNG, JPG)
- Check browser console for errors

**Settings not saving?**
- Verify all required fields are filled
- Check browser console for errors
- Try refreshing the page

## 📝 Notes

- All changes are saved immediately
- Documents are stored in Supabase Storage
- User requests are stored in the database
- Admin actions are logged for audit purposes

