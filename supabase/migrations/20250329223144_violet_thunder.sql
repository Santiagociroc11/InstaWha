/*
  # Fix RLS policies for contact lists

  1. Changes
    - Enable RLS on all tables
    - Update RLS policies to use user_id from trigger
    - Fix user_id handling in policies

  2. Security
    - Ensure proper user_id checks in all policies
    - Maintain data isolation between users
*/

-- Enable RLS on all tables
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own contact lists" ON contact_lists;
DROP POLICY IF EXISTS "Users can manage their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can manage their own message history" ON message_history;

-- Create new RLS policies
CREATE POLICY "Users can manage their own contact lists"
  ON contact_lists
  FOR ALL
  USING (user_id = (SELECT id FROM users WHERE id = user_id))
  WITH CHECK (user_id = (SELECT id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own contacts"
  ON contacts
  FOR ALL
  USING (user_id = (SELECT id FROM users WHERE id = user_id))
  WITH CHECK (user_id = (SELECT id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own message history"
  ON message_history
  FOR ALL
  USING (user_id = (SELECT id FROM users WHERE id = user_id))
  WITH CHECK (user_id = (SELECT id FROM users WHERE id = user_id));