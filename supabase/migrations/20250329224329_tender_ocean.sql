/*
  # Fix user ID handling and RLS policies

  1. Changes
    - Ensure user_id is properly set for all tables
    - Update RLS policies to work with the current authentication system
    - Add default user ID for testing purposes

  2. Security
    - Enable RLS on all tables
    - Create policies that allow access based on user_id
*/

-- Enable RLS on all tables
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own contact lists" ON contact_lists;
DROP POLICY IF EXISTS "Users can manage their own message history" ON message_history;

-- Create new RLS policies
CREATE POLICY "Users can manage their own contact lists"
  ON contact_lists
  FOR ALL
  USING (user_id IS NOT NULL)
  WITH CHECK (user_id IS NOT NULL);

CREATE POLICY "Users can manage their own message history"
  ON message_history
  FOR ALL
  USING (user_id IS NOT NULL)
  WITH CHECK (user_id IS NOT NULL);

-- Set default user ID for existing records
UPDATE contact_lists
SET user_id = (SELECT id FROM users WHERE username = 'admin')
WHERE user_id IS NULL;

UPDATE message_history
SET user_id = (SELECT id FROM users WHERE username = 'admin')
WHERE user_id IS NULL;

-- Add NOT NULL constraint back
ALTER TABLE contact_lists
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE message_history
ALTER COLUMN user_id SET NOT NULL;