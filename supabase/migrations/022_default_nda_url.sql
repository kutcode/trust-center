-- Ensure every environment has a usable NDA URL by default
ALTER TABLE trust_center_settings
ALTER COLUMN nda_url SET DEFAULT '/nda-sample.html';

-- Backfill existing rows missing NDA URL
UPDATE trust_center_settings
SET nda_url = '/nda-sample.html'
WHERE nda_url IS NULL OR btrim(nda_url) = '';
