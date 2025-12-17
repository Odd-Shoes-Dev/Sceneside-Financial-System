-- Add missing fields to website_tours table

ALTER TABLE website_tours 
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS price_per_person DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS group_discount_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_group_size INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50) DEFAULT 'Easy',
ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS inclusions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS exclusions JSONB DEFAULT '[]'::jsonb;

-- Update existing tours to have default values if null
UPDATE website_tours 
SET 
  difficulty_level = 'Easy' 
WHERE difficulty_level IS NULL;
