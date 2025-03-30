/*
  # Add users table and remove auth dependencies

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password` (text)
      - `created_at` (timestamp)

  2. Changes
    - Remove auth.users foreign key constraints
    - Add users table foreign key constraints
    - Update RLS policies to use user_id directly
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert default user
INSERT INTO users (id, username, password)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- Modify contact_lists table
ALTER TABLE contact_lists
  DROP CONSTRAINT IF EXISTS contact_lists_user_id_fkey,
  ADD CONSTRAINT contact_lists_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE;

-- Modify contacts table
ALTER TABLE contacts
  DROP CONSTRAINT IF EXISTS contacts_user_id_fkey,
  ADD CONSTRAINT contacts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE;

-- Modify message_history table
ALTER TABLE message_history
  DROP CONSTRAINT IF EXISTS message_history_user_id_fkey,
  ADD CONSTRAINT message_history_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can manage their own contact lists" ON contact_lists;
DROP POLICY IF EXISTS "Users can manage their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can manage their own message history" ON message_history;

-- Create new RLS policies without auth dependency
CREATE POLICY "Users can manage their own contact lists"
  ON contact_lists
  FOR ALL
  USING (user_id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can manage their own contacts"
  ON contacts
  FOR ALL
  USING (user_id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can manage their own message history"
  ON message_history
  FOR ALL
  USING (user_id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');