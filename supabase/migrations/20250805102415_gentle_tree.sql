/*
  # Debug and Fix Roles System

  1. Check and create roles table
  2. Insert default roles if missing
  3. Fix RLS policies for proper access
  4. Create admin user if needed
*/

-- First, let's make sure the roles table exists and has data
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert default roles if they don't exist
INSERT INTO roles (name) VALUES 
  ('admin'),
  ('dev'),
  ('pm'),
  ('cto'),
  ('lead'),
  ('designer')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on roles table
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read roles" ON roles;
DROP POLICY IF EXISTS "Authenticated users can read roles" ON roles;
DROP POLICY IF EXISTS "Only admins can modify roles" ON roles;

-- Create new policies that allow public read access (needed for signup)
CREATE POLICY "Public can read roles"
  ON roles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can modify roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Make sure users table has proper structure
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update users RLS policies
DROP POLICY IF EXISTS "Users can read all user profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Only admins can insert/delete users" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;

CREATE POLICY "Users can read all user profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "Anyone can insert users during signup"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Only admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users users_1
      WHERE users_1.auth_id = auth.uid() 
      AND users_1.role = 'admin'
    )
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();