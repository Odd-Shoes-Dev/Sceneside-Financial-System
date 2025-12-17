-- Add subject column to website_inquiries table
ALTER TABLE website_inquiries 
ADD COLUMN IF NOT EXISTS subject VARCHAR(255);
