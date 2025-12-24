-- Function to create users (for admin user management)
CREATE OR REPLACE FUNCTION create_user_with_password(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_is_admin BOOLEAN DEFAULT FALSE,
    p_admin_role TEXT DEFAULT 'admin'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_identity_id UUID;
BEGIN
    -- Generate user ID
    v_user_id := gen_random_uuid();
    v_identity_id := gen_random_uuid();

    -- Check if user already exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        -- Insert new user
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            is_super_admin,
            is_sso_user
        )
        VALUES (
            v_user_id,
            p_email,
            crypt(p_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            COALESCE(jsonb_build_object('full_name', p_full_name), '{}'::jsonb),
            false,
            false
        );
    ELSE
        -- Update existing user password
        UPDATE auth.users
        SET encrypted_password = crypt(p_password, gen_salt('bf')),
            updated_at = NOW()
        WHERE id = v_user_id;
    END IF;

    -- Insert into auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at,
        last_sign_in_at
    )
    VALUES (
        v_identity_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', p_email),
        'email',
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT DO NOTHING;

    -- If admin user, add to admin_users table
    IF p_is_admin THEN
        INSERT INTO admin_users (id, email, full_name, role)
        VALUES (v_user_id, p_email, COALESCE(p_full_name, 'Admin User'), p_admin_role)
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            updated_at = NOW();
    END IF;

    RETURN v_user_id;
END;
$$;

-- Function to update user password
CREATE OR REPLACE FUNCTION update_user_password(
    p_user_id UUID,
    p_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE auth.users
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN FOUND;
END;
$$;

-- Function to get all users (for admin panel)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    raw_user_meta_data JSONB,
    is_admin BOOLEAN,
    admin_role TEXT,
    full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.created_at,
        u.email_confirmed_at,
        u.raw_user_meta_data,
        COALESCE(au.id IS NOT NULL, false) as is_admin,
        au.role as admin_role,
        COALESCE(au.full_name, u.raw_user_meta_data->>'full_name') as full_name
    FROM auth.users u
    LEFT JOIN admin_users au ON u.id = au.id
    ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_user_with_password TO service_role;
GRANT EXECUTE ON FUNCTION update_user_password TO service_role;
GRANT EXECUTE ON FUNCTION get_all_users TO service_role;

