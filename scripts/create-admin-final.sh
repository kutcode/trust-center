#!/bin/bash

echo "👤 Creating Admin User..."
echo ""

EMAIL="admin@example.com"
PASSWORD="admin123"
FULL_NAME="Admin User"

echo "Email: $EMAIL"
echo "Password: $PASSWORD"
echo ""

# Try using GoTrue API directly
echo "Attempting to create user via GoTrue API..."

RESPONSE=$(curl -s -X POST http://localhost:8000/auth/v1/admin/users \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"$FULL_NAME\"}}")

echo "Response: $RESPONSE"

# If API fails, try SQL method
if echo "$RESPONSE" | grep -q "error\|Invalid"; then
    echo ""
    echo "API method failed, trying SQL method..."
    
    docker exec trust-center-db psql -U postgres -d postgres <<EOF
-- Create user via SQL
DO \$\$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- Insert user
    INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, aud, role,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user
    )
    VALUES (
        new_user_id, '$EMAIL', crypt('$PASSWORD', gen_salt('bf')), NOW(),
        NOW(), NOW(), 'authenticated', 'authenticated',
        '{"provider": "email"}'::jsonb, '{"full_name": "$FULL_NAME"}'::jsonb, false, false
    );
    
    -- Create identity
    INSERT INTO auth.identities (id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    VALUES (
        gen_random_uuid(), new_user_id,
        jsonb_build_object('sub', new_user_id::text, 'email', '$EMAIL'),
        'email', NOW(), NOW(), NOW()
    );
    
    -- Add to admin_users
    INSERT INTO admin_users (id, email, full_name, role)
    VALUES (new_user_id, '$EMAIL', '$FULL_NAME', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
    
    RAISE NOTICE 'User created: %', new_user_id;
END \$\$;

SELECT u.id, u.email, au.full_name, au.role 
FROM auth.users u 
JOIN admin_users au ON u.id = au.id 
WHERE u.email = '$EMAIL';
EOF
fi

echo ""
echo "✅ Done! Try logging in at http://localhost:3000/admin/login"
echo "Email: $EMAIL"
echo "Password: $PASSWORD"

