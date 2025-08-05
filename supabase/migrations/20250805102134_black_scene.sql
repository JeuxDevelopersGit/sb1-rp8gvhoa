/*
  # Create Admin User and Setup

  1. Create admin user in auth.users
  2. Create corresponding profile in users table
  3. Ensure roles table has data
*/

-- First, ensure roles exist
INSERT INTO roles (name) VALUES 
  ('admin'),
  ('dev'),
  ('pm'),
  ('cto'),
  ('lead'),
  ('designer')
ON CONFLICT (name) DO NOTHING;

-- Note: You need to manually create the auth user in Supabase Dashboard
-- Go to Authentication > Users > Add User
-- Email: admin@jeux.com
-- Password: 123123123
-- Then run this to create the profile:

-- This will create the profile once the auth user exists
DO $$
DECLARE
    admin_auth_id UUID;
BEGIN
    -- Get the auth user ID (this will only work after you create the user in dashboard)
    SELECT id INTO admin_auth_id 
    FROM auth.users 
    WHERE email = 'admin@jeux.com';
    
    -- Only insert if we found the auth user
    IF admin_auth_id IS NOT NULL THEN
        INSERT INTO users (auth_id, name, email, role)
        VALUES (admin_auth_id, 'Admin User', 'admin@jeux.com', 'admin')
        ON CONFLICT (email) DO UPDATE SET
            auth_id = admin_auth_id,
            name = 'Admin User',
            role = 'admin';
    END IF;
END $$;