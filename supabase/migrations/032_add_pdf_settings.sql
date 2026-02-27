-- Add pdf_settings JSONB column to company_settings
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS pdf_settings JSONB DEFAULT '{}';

-- Set a sensible default for existing rows
UPDATE company_settings
SET pdf_settings = '{
  "template": "classic",
  "primaryColor": "#1e3a5f",
  "accentColor": "#3b82f6",
  "fontFamily": "sans-serif",
  "showLogo": true,
  "logoPosition": "left",
  "showBankDetails": true,
  "showPaymentTerms": true,
  "showSignatureLine": false,
  "showTaxId": true,
  "footerText": "Thank you for your business!",
  "headerText": ""
}'::jsonb
WHERE pdf_settings = '{}'::jsonb OR pdf_settings IS NULL;
