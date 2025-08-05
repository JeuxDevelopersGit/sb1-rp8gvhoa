/*
  # Initial JeuxBoard Database Schema

  1. New Tables
    - `roles` - Dynamic role management (admin, dev, pm, cto, lead, designer)
    - `users` - User profiles linked to Supabase auth
    - `projects` - Main project entities with status tracking
    - `project_modules` - Detailed module management with workflow stages
    - `project_members` - Project team assignments

  2. Security
    - Enable RLS on all tables
    - Role-based access policies
    - Field-level permissions based on user roles

  3. Enums
    - project_status: not_started, in_progress, blocked, done
    - review_status: pending, approved, rejected
*/

-- Create custom types
CREATE TYPE project_status AS ENUM ('not_started', 'in_progress', 'blocked', 'done');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Users table
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

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  stack text NOT NULL,
  sprint text NOT NULL,
  notes text,
  status project_status DEFAULT 'not_started',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project modules table
CREATE TABLE IF NOT EXISTS project_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  module_name text NOT NULL,
  platform_stack text NOT NULL,
  assigned_dev_id uuid REFERENCES users(id) ON DELETE SET NULL,
  design_locked_date timestamptz,
  dev_start_date timestamptz,
  self_qa_date timestamptz,
  lead_signoff_date timestamptz,
  pm_review_date timestamptz,
  cto_review_status review_status DEFAULT 'pending',
  client_ready_status review_status DEFAULT 'pending',
  status project_status DEFAULT 'not_started',
  eta timestamptz,
  sprint text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project members table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role_in_project text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Insert default roles
INSERT INTO roles (name) VALUES 
  ('admin'),
  ('dev'),
  ('pm'),
  ('cto'),
  ('lead'),
  ('designer')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles
CREATE POLICY "Anyone can read roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify roles"
  ON roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- RLS Policies for users
CREATE POLICY "Users can read all user profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "Only admins can insert/delete users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- RLS Policies for projects
CREATE POLICY "Users can read projects they're members of or all if admin/pm/cto"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND (
        users.role IN ('admin', 'pm', 'cto') OR
        EXISTS (
          SELECT 1 FROM project_members 
          WHERE project_members.project_id = projects.id 
          AND project_members.user_id = users.id
        )
      )
    )
  );

CREATE POLICY "Only admins can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins and PMs can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role IN ('admin', 'pm')
    )
  );

-- RLS Policies for project_modules
CREATE POLICY "Users can read modules from their projects"
  ON project_modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND (
        users.role IN ('admin', 'pm', 'cto') OR
        EXISTS (
          SELECT 1 FROM project_members 
          WHERE project_members.project_id = project_modules.project_id 
          AND project_members.user_id = users.id
        ) OR
        assigned_dev_id = users.id
      )
    )
  );

CREATE POLICY "Role-based module updates"
  ON project_modules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND (
        users.role = 'admin' OR
        (users.role = 'pm' AND users.id IN (
          SELECT user_id FROM project_members 
          WHERE project_id = project_modules.project_id
        )) OR
        (users.role = 'dev' AND users.id = assigned_dev_id) OR
        (users.role = 'lead') OR
        (users.role = 'cto') OR
        (users.role = 'designer')
      )
    )
  );

-- RLS Policies for project_members
CREATE POLICY "Users can read project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND (
        users.role IN ('admin', 'pm', 'cto') OR
        user_id = users.id
      )
    )
  );

CREATE POLICY "Only admins can manage project members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_sprint ON projects(sprint);
CREATE INDEX IF NOT EXISTS idx_project_modules_project_id ON project_modules(project_id);
CREATE INDEX IF NOT EXISTS idx_project_modules_assigned_dev ON project_modules(assigned_dev_id);
CREATE INDEX IF NOT EXISTS idx_project_modules_status ON project_modules(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_modules_updated_at BEFORE UPDATE ON project_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();