/*
  # Fix RLS policies for roles table and create admin user

  1. Security
    - Allow public access to read roles (needed for signup)
    - Create admin user in auth.users
    - Create corresponding user profile
*/

-- First, let's make sure roles table allows public read access for signup
DROP POLICY IF EXISTS "Anyone can read roles" ON roles;
CREATE POLICY "Anyone can read roles" 
  ON roles 
  FOR SELECT 
  TO public 
  USING (true);

-- Also allow authenticated users to read roles
CREATE POLICY "Authenticated users can read roles" 
  ON roles 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Insert roles if they don't exist
INSERT INTO roles (name) VALUES 
  ('admin'),
  ('dev'),
  ('pm'),
  ('cto'),
  ('lead'),
  ('designer')
ON CONFLICT (name) DO NOTHING;

-- Create admin user function (this needs to be run manually in Supabase SQL editor)
-- We can't directly insert into auth.users from migrations, so we'll create the profile
-- and you'll need to create the auth user manually

-- First, let's create a temporary function to handle this
CREATE OR REPLACE FUNCTION create_admin_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will be called after the auth user is created
  INSERT INTO users (auth_id, name, email, role)
  SELECT 
    id,
    'Admin User',
    'admin@jeux.com',
    'admin'
  FROM auth.users 
  WHERE email = 'admin@jeux.com'
  ON CONFLICT (email) DO NOTHING;
END;
$$;