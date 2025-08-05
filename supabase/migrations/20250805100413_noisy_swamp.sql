/*
  # Ensure roles table has data

  1. Insert default roles if they don't exist
  2. Make sure roles table is properly populated
*/

-- Insert default roles if they don't exist
INSERT INTO roles (name) VALUES 
  ('admin'),
  ('dev'), 
  ('pm'),
  ('cto'),
  ('lead'),
  ('designer')
ON CONFLICT (name) DO NOTHING;