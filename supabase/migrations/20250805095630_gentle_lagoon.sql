/*
  # Insert Demo Data for JeuxBoard

  1. Demo Users
    - Admin user for testing
    - Sample developers and team members

  2. Demo Projects
    - Sample projects with different statuses
    - Various tech stacks and sprints

  3. Demo Modules
    - Project modules with different workflow stages
    - Assigned to different developers
*/

-- Insert demo admin user (this will be created when they sign up)
-- The auth user will be created via Supabase Auth, this is just for reference

-- Insert demo projects
INSERT INTO projects (id, title, stack, sprint, notes, status, created_at) VALUES 
  (
    gen_random_uuid(),
    'E-Commerce Mobile App',
    'Flutter + Firebase + Node.js',
    'Sprint 1',
    'Complete mobile e-commerce solution with payment integration',
    'in_progress',
    now() - interval '5 days'
  ),
  (
    gen_random_uuid(),
    'Admin Dashboard',
    'React + TypeScript + Supabase',
    'Sprint 2',
    'Internal admin dashboard for managing users and analytics',
    'not_started',
    now() - interval '3 days'
  ),
  (
    gen_random_uuid(),
    'API Gateway',
    'Node.js + Express + PostgreSQL',
    'Sprint 1',
    'Microservices API gateway with authentication and rate limiting',
    'done',
    now() - interval '10 days'
  ),
  (
    gen_random_uuid(),
    'Marketing Website',
    'Next.js + TailwindCSS + Vercel',
    'Sprint 3',
    'Company marketing website with blog and contact forms',
    'blocked',
    now() - interval '2 days'
  );

-- Get project IDs for module insertion
DO $$
DECLARE
    ecommerce_id uuid;
    dashboard_id uuid;
    api_id uuid;
    marketing_id uuid;
BEGIN
    -- Get project IDs
    SELECT id INTO ecommerce_id FROM projects WHERE title = 'E-Commerce Mobile App';
    SELECT id INTO dashboard_id FROM projects WHERE title = 'Admin Dashboard';
    SELECT id INTO api_id FROM projects WHERE title = 'API Gateway';
    SELECT id INTO marketing_id FROM projects WHERE title = 'Marketing Website';

    -- Insert demo modules for E-Commerce App
    INSERT INTO project_modules (
        project_id, module_name, platform_stack, design_locked_date, 
        dev_start_date, self_qa_date, status, eta, sprint, notes
    ) VALUES 
    (
        ecommerce_id,
        'User Authentication',
        'Flutter + Firebase Auth',
        now() - interval '8 days',
        now() - interval '6 days',
        now() - interval '2 days',
        'done',
        now() + interval '1 day',
        'Sprint 1',
        'Complete user auth with social login'
    ),
    (
        ecommerce_id,
        'Product Catalog',
        'Flutter + Firebase Firestore',
        now() - interval '5 days',
        now() - interval '3 days',
        null,
        'in_progress',
        now() + interval '5 days',
        'Sprint 1',
        'Product listing and search functionality'
    ),
    (
        ecommerce_id,
        'Payment Integration',
        'Flutter + Stripe',
        now() - interval '2 days',
        null,
        null,
        'not_started',
        now() + interval '10 days',
        'Sprint 2',
        'Stripe payment processing'
    );

    -- Insert demo modules for Admin Dashboard
    INSERT INTO project_modules (
        project_id, module_name, platform_stack, design_locked_date, 
        status, eta, sprint, notes
    ) VALUES 
    (
        dashboard_id,
        'User Management',
        'React + TypeScript',
        now() - interval '1 day',
        'not_started',
        now() + interval '7 days',
        'Sprint 2',
        'CRUD operations for user management'
    ),
    (
        dashboard_id,
        'Analytics Dashboard',
        'React + Recharts',
        null,
        'not_started',
        now() + interval '14 days',
        'Sprint 2',
        'Charts and metrics visualization'
    );

    -- Insert demo modules for API Gateway
    INSERT INTO project_modules (
        project_id, module_name, platform_stack, design_locked_date, 
        dev_start_date, self_qa_date, lead_signoff_date, pm_review_date,
        cto_review_status, client_ready_status, status, eta, sprint, notes
    ) VALUES 
    (
        api_id,
        'Authentication Service',
        'Node.js + JWT',
        now() - interval '15 days',
        now() - interval '12 days',
        now() - interval '8 days',
        now() - interval '6 days',
        now() - interval '4 days',
        'approved',
        'approved',
        'done',
        now() - interval '3 days',
        'Sprint 1',
        'JWT-based authentication service'
    ),
    (
        api_id,
        'Rate Limiting',
        'Node.js + Redis',
        now() - interval '12 days',
        now() - interval '10 days',
        now() - interval '6 days',
        now() - interval '4 days',
        now() - interval '2 days',
        'approved',
        'approved',
        'done',
        now() - interval '1 day',
        'Sprint 1',
        'Redis-based rate limiting'
    );

    -- Insert demo modules for Marketing Website
    INSERT INTO project_modules (
        project_id, module_name, platform_stack, design_locked_date, 
        status, eta, sprint, notes
    ) VALUES 
    (
        marketing_id,
        'Landing Page',
        'Next.js + TailwindCSS',
        now() - interval '3 days',
        'blocked',
        now() + interval '8 days',
        'Sprint 3',
        'Blocked due to design revisions needed'
    ),
    (
        marketing_id,
        'Blog System',
        'Next.js + MDX',
        null,
        'not_started',
        now() + interval '15 days',
        'Sprint 3',
        'MDX-based blog with CMS integration'
    );
END $$;