/*
  # Complete JeuxBoard Schema with RLS Policies

  1. Tables
    - users (with auth integration)
    - roles (system roles)
    - projects (main projects)
    - project_modules (detailed module tracking)
    - project_members (team assignments)

  2. Security
    - Enable RLS on all tables
    - Role-based access policies
    - Field-level permissions for modules

  3. Indexes
    - Performance optimization for common queries
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('not_started', 'in_progress', 'blocked', 'done');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'dev',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    stack TEXT NOT NULL,
    sprint TEXT NOT NULL,
    notes TEXT,
    status project_status DEFAULT 'not_started',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project modules table
CREATE TABLE IF NOT EXISTS project_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL,
    platform_stack TEXT NOT NULL,
    assigned_dev_id UUID REFERENCES users(id) ON DELETE SET NULL,
    design_locked_date TIMESTAMPTZ,
    dev_start_date TIMESTAMPTZ,
    self_qa_date TIMESTAMPTZ,
    lead_signoff_date TIMESTAMPTZ,
    pm_review_date TIMESTAMPTZ,
    cto_review_status review_status DEFAULT 'pending',
    client_ready_status review_status DEFAULT 'pending',
    status project_status DEFAULT 'not_started',
    eta TIMESTAMPTZ,
    sprint TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project members table
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_in_project TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_projects_sprint ON projects(sprint);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_modules_project_id ON project_modules(project_id);
CREATE INDEX IF NOT EXISTS idx_project_modules_assigned_dev ON project_modules(assigned_dev_id);
CREATE INDEX IF NOT EXISTS idx_project_modules_status ON project_modules(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_modules_updated_at ON project_modules;
CREATE TRIGGER update_project_modules_updated_at
    BEFORE UPDATE ON project_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table
DROP POLICY IF EXISTS "Public can read roles" ON roles;
CREATE POLICY "Public can read roles"
    ON roles FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Only admins can modify roles" ON roles;
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

-- RLS Policies for users table
DROP POLICY IF EXISTS "Anyone can insert users during signup" ON users;
CREATE POLICY "Anyone can insert users during signup"
    ON users FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read all user profiles" ON users;
CREATE POLICY "Users can read all user profiles"
    ON users FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth_id = auth.uid());

DROP POLICY IF EXISTS "Only admins can delete users" ON users;
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

-- RLS Policies for projects table
DROP POLICY IF EXISTS "Users can read projects they're members of or all if admin/pm/cto" ON projects;
CREATE POLICY "Users can read projects they're members of or all if admin/pm/cto"
    ON projects FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()
            AND (
                users.role IN ('admin', 'pm', 'cto')
                OR EXISTS (
                    SELECT 1 FROM project_members
                    WHERE project_members.project_id = projects.id
                    AND project_members.user_id = users.id
                )
            )
        )
    );

DROP POLICY IF EXISTS "Only admins can create projects" ON projects;
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

DROP POLICY IF EXISTS "Admins and PMs can update projects" ON projects;
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

-- RLS Policies for project_modules table
DROP POLICY IF EXISTS "Users can read modules from their projects" ON project_modules;
CREATE POLICY "Users can read modules from their projects"
    ON project_modules FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()
            AND (
                users.role IN ('admin', 'pm', 'cto')
                OR EXISTS (
                    SELECT 1 FROM project_members
                    WHERE project_members.project_id = project_modules.project_id
                    AND project_members.user_id = users.id
                )
                OR project_modules.assigned_dev_id = users.id
            )
        )
    );

DROP POLICY IF EXISTS "Admins and PMs can create modules" ON project_modules;
CREATE POLICY "Admins and PMs can create modules"
    ON project_modules FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()
            AND users.role IN ('admin', 'pm')
        )
    );

DROP POLICY IF EXISTS "Role-based module updates" ON project_modules;
CREATE POLICY "Role-based module updates"
    ON project_modules FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()
            AND (
                users.role = 'admin'
                OR (users.role = 'pm' AND users.id IN (
                    SELECT project_members.user_id
                    FROM project_members
                    WHERE project_members.project_id = project_modules.project_id
                ))
                OR (users.role = 'dev' AND users.id = project_modules.assigned_dev_id)
                OR users.role IN ('lead', 'cto', 'designer')
            )
        )
    );

DROP POLICY IF EXISTS "Only admins can delete modules" ON project_modules;
CREATE POLICY "Only admins can delete modules"
    ON project_modules FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- RLS Policies for project_members table
DROP POLICY IF EXISTS "Users can read project members" ON project_members;
CREATE POLICY "Users can read project members"
    ON project_members FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()
            AND (
                users.role IN ('admin', 'pm', 'cto')
                OR project_members.user_id = users.id
            )
        )
    );

DROP POLICY IF EXISTS "Only admins can manage project members" ON project_members;
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