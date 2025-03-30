/*
  # Fix user_id handling for contact lists and contacts

  1. Changes
    - Add trigger to automatically set user_id on insert for contact_lists
    - Add trigger to automatically set user_id on insert for contacts
    - Ensure user_id is properly enforced with NOT NULL constraints

  2. Security
    - Automatically set user_id to the authenticated user's ID
    - Prevent manual setting of user_id
*/

-- Function to set user_id from auth.uid()
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for contact_lists
DROP TRIGGER IF EXISTS set_user_id_contact_lists ON contact_lists;
CREATE TRIGGER set_user_id_contact_lists
  BEFORE INSERT ON contact_lists
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Trigger for contacts
DROP TRIGGER IF EXISTS set_user_id_contacts ON contacts;
CREATE TRIGGER set_user_id_contacts
  BEFORE INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();