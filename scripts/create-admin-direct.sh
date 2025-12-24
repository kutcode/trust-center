#!/bin/bash

echo "👤 Creating Admin User (Direct SQL Method)..."
echo ""

EMAIL="${1:-admin@example.com}"
PASSWORD="${2:-admin123}"
FULL_NAME="${3:-Admin User}"

echo "Email: $EMAIL"
echo "Password: $PASSWORD"
echo "Full Name: $FULL_NAME"
echo ""

# Generate a UUID for the user
USER_ID=$(docker exec trust-center-db psql -U postgres -d postgres -t -c "SELECT gen_random_uuid();" | tr -d ' ')

echo "Creating user with ID: $USER_ID"

# Create user directly in auth.users with proper password hash
# Note: This uses bcrypt hash format that GoTrue expects
docker exec trust-center-db psql -U postgres -d postgres <<EOF
-- Insert into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  '$USER_ID',
  '00000000-0000-0000-0000-000000000000',
  '$EMAIL',
  crypt('$PASSWORD', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "$FULL_NAME"}'::jsonb,
  'authenticated',
  'authenticated'
)
ON CONFLICT (email) DO UPDATE
SET encrypted_password = crypt('$PASSWORD', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW();

-- Insert into auth.identities (required by GoTrue)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '$USER_ID',
  jsonb_build_object('sub', '$USER_ID', 'email', '$EMAIL'),
  'email',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Add to admin_users table
INSERT INTO admin_users (id, email, full_name, role)
VALUES ('$USER_ID', '$EMAIL', '$FULL_NAME', 'admin')
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = 'admin',
    updated_at = NOW();

-- Show the created user
SELECT 
  u.id,
  u.email,
  au.full_name,
  au.role,
  u.email_confirmed_at IS NOT NULL as confirmed
FROM auth.users u
JOIN admin_users au ON u.id = au.id
WHERE u.email = '$EMAIL';
EOF

echo ""
echo "✅ Admin user created!"
echo ""
echo "You can now login at: http://localhost:3000/admin/login"
echo "Email: $EMAIL"
echo "Password: $PASSWORD"

