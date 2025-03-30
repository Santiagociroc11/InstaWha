/*
  # Initial Schema Setup

  1. New Tables
    - `contact_lists`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key)

    - `contacts`
      - `id` (uuid, primary key)
      - `name` (text)
      - `number` (text)
      - `list_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key)

    - `message_history`
      - `id` (uuid, primary key)
      - `message` (text)
      - `variables` (jsonb)
      - `status` (text)
      - `sent_at` (timestamp)
      - `user_id` (uuid, foreign key)
      - `contact_id` (uuid, foreign key)
      - `batch_id` (uuid)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add indexes for frequently queried columns
*/

-- Create contact_lists table
CREATE TABLE IF NOT EXISTS contact_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT contact_lists_name_user_id_key UNIQUE (name, user_id)
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  number text NOT NULL,
  list_id uuid REFERENCES contact_lists(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create message_history table
CREATE TABLE IF NOT EXISTS message_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  variables jsonb,
  status text NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  sent_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  batch_id uuid NOT NULL,
  error_message text
);

-- Enable RLS
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_history ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_lists
CREATE POLICY "Users can manage their own contact lists"
  ON contact_lists
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for contacts
CREATE POLICY "Users can manage their own contacts"
  ON contacts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for message_history
CREATE POLICY "Users can manage their own message history"
  ON message_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_list_id ON contacts(list_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_message_history_batch_id ON message_history(batch_id);
CREATE INDEX IF NOT EXISTS idx_message_history_sent_at ON message_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_message_history_user_id ON message_history(user_id);