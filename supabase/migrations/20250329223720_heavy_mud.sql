/*
  # Modify schema to use JSON for contacts

  1. Changes
    - Add contacts_json column to contact_lists table
    - Drop contacts table since contacts will be stored in contact_lists
    - Update message_history to reference contact data from JSON

  2. Security
    - Maintain RLS policies for contact_lists
    - Update triggers and functions to handle new schema
*/

-- Add contacts_json column to contact_lists
ALTER TABLE contact_lists
ADD COLUMN contacts_json jsonb DEFAULT '[]'::jsonb;

-- Create a function to validate contact JSON structure
CREATE OR REPLACE FUNCTION validate_contact_json()
RETURNS trigger AS $$
BEGIN
  -- Ensure contacts_json is an array
  IF NOT jsonb_typeof(NEW.contacts_json) = 'array' THEN
    RAISE EXCEPTION 'contacts_json must be an array';
  END IF;

  -- Validate each contact object
  FOR i IN 0..jsonb_array_length(NEW.contacts_json) - 1 LOOP
    IF NOT (
      jsonb_typeof(NEW.contacts_json->i->'name') = 'string' AND
      jsonb_typeof(NEW.contacts_json->i->'number') = 'string'
    ) THEN
      RAISE EXCEPTION 'Each contact must have name and number as strings';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contact validation
CREATE TRIGGER validate_contacts_json
  BEFORE INSERT OR UPDATE ON contact_lists
  FOR EACH ROW
  EXECUTE FUNCTION validate_contact_json();

-- Migrate existing contacts to JSON format
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM contact_lists LOOP
    UPDATE contact_lists
    SET contacts_json = (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'number', c.number
        )
      )
      FROM contacts c
      WHERE c.list_id = r.id
    )
    WHERE id = r.id;
  END LOOP;
END $$;

-- Update message_history to store contact info directly
ALTER TABLE message_history
ADD COLUMN contact_info jsonb;

-- Migrate existing message history contact data
UPDATE message_history mh
SET contact_info = jsonb_build_object(
  'id', c.id,
  'name', c.name,
  'number', c.number
)
FROM contacts c
WHERE c.id = mh.contact_id;

-- Drop old columns and tables
ALTER TABLE message_history
DROP COLUMN contact_id;

DROP TABLE contacts;