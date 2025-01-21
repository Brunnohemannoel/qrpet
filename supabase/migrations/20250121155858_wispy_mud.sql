/*
  # Add status field to pets table

  1. Changes
    - Add status column to pets table with default value 'active'
    - Update existing records to have the default status
*/

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pets' AND column_name = 'status'
  ) THEN
    ALTER TABLE pets ADD COLUMN status text NOT NULL DEFAULT 'active';
  END IF;
END $$;