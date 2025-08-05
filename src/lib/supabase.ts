import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration Check:');
console.log('URL:', supabaseUrl);
console.log('Anon Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');
console.log('Environment variables loaded:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection on initialization
supabase.from('roles').select('count').limit(1).then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection test failed:', error);
  } else {
    console.log('✅ Supabase connection successful');
  }
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string;
          name: string;
          email: string;
          role: string;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_id: string;
          name: string;
          email: string;
          role: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string;
          name?: string;
          email?: string;
          role?: string;
          avatar_url?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          stack: string;
          sprint: string;
          notes?: string;
          status: 'not_started' | 'in_progress' | 'blocked' | 'done';
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          stack: string;
          sprint: string;
          notes?: string;
          status?: 'not_started' | 'in_progress' | 'blocked' | 'done';
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          stack?: string;
          sprint?: string;
          notes?: string;
          status?: 'not_started' | 'in_progress' | 'blocked' | 'done';
          updated_at?: string;
        };
      };
      project_modules: {
        Row: {
          id: string;
          project_id: string;
          module_name: string;
          platform_stack: string;
          assigned_dev_id?: string;
          design_locked_date?: string;
          dev_start_date?: string;
          self_qa_date?: string;
          lead_signoff_date?: string;
          pm_review_date?: string;
          cto_review_status: 'pending' | 'approved' | 'rejected';
          client_ready_status: 'pending' | 'approved' | 'rejected';
          status: 'not_started' | 'in_progress' | 'blocked' | 'done';
          eta?: string;
          sprint: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          module_name: string;
          platform_stack: string;
          assigned_dev_id?: string;
          design_locked_date?: string;
          dev_start_date?: string;
          self_qa_date?: string;
          lead_signoff_date?: string;
          pm_review_date?: string;
          cto_review_status?: 'pending' | 'approved' | 'rejected';
          client_ready_status?: 'pending' | 'approved' | 'rejected';
          status?: 'not_started' | 'in_progress' | 'blocked' | 'done';
          eta?: string;
          sprint: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          module_name?: string;
          platform_stack?: string;
          assigned_dev_id?: string;
          design_locked_date?: string;
          dev_start_date?: string;
          self_qa_date?: string;
          lead_signoff_date?: string;
          pm_review_date?: string;
          cto_review_status?: 'pending' | 'approved' | 'rejected';
          client_ready_status?: 'pending' | 'approved' | 'rejected';
          status?: 'not_started' | 'in_progress' | 'blocked' | 'done';
          eta?: string;
          sprint?: string;
          notes?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role_in_project: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role_in_project: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role_in_project?: string;
        };
      };
    };
  };
};