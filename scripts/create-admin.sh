#!/bin/bash

echo "👤 Creating Admin User..."
echo ""

# Default values
EMAIL="${1:-admin@example.com}"
PASSWORD="${2:-admin123}"
FULL_NAME="${3:-Admin User}"

echo "Email: $EMAIL"
echo "Password: $PASSWORD"
echo "Full Name: $FULL_NAME"
echo ""

# Create auth user
echo "Creating auth user..."
docker exec trust-center-db psql -U postgres -d postgres <<EOF
-- Delete existing user if exists (to recreate)
DELETE FROM admin_users WHERE email = '$EMAIL';
DELETE FROM auth.users WHERE email = '$EMAIL';

-- Create auth user
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at
)
VALUES (
  uuid_generate_v4(),
  '$EMAIL',
  crypt('$PASSWORD', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Create admin_users entry
INSERT INTO admin_users (id, email, full_name, role)
SELECT id, email, '$FULL_NAME', 'admin' 
FROM auth.users 
WHERE email = '$EMAIL';

-- Show the created user
SELECT 
  u.id,
  u.email,
  au.full_name,
  au.role,
  u.email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users u
JOIN admin_users au ON u.id = au.id
WHERE u.email = '$EMAIL';
EOF

echo ""
echo "✅ Admin user created successfully!"
echo ""
echo "You can now login at: http://localhost:3000/admin/login"
echo "Email: $EMAIL"
echo "Password: $PASSWORD"
