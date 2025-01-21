/*
  # Add support for multiple photos

  1. Changes
    - Add fotos_urls array column to pets table
    - Update existing foto_url data
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add fotos_urls column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pets' AND column_name = 'fotos_urls'
  ) THEN
    ALTER TABLE pets ADD COLUMN fotos_urls text[] DEFAULT '{}';
    
    -- Migrate existing foto_url data to fotos_urls array
    UPDATE pets 
    SET fotos_urls = ARRAY[foto_url]
    WHERE foto_url IS NOT NULL AND foto_url != '';
  END IF;
END $$;