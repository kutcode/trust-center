-- Add NDA URL field to trust_center_settings
ALTER TABLE trust_center_settings 
ADD COLUMN IF NOT EXISTS nda_url TEXT;

COMMENT ON COLUMN trust_center_settings.nda_url IS 'URL to the NDA document that users must accept before requesting documents';
