-- Migration: Add branding columns to trust_center_settings
-- Adds favicon_url, font_family, and footer_links for enhanced white-labeling

-- Add favicon URL
ALTER TABLE trust_center_settings 
ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Add font family (Google Font name)
ALTER TABLE trust_center_settings 
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter';

-- Add footer links as JSONB (array of {label, url} objects)
ALTER TABLE trust_center_settings 
ADD COLUMN IF NOT EXISTS footer_links JSONB DEFAULT '[]';

-- Add accent color for more customization
ALTER TABLE trust_center_settings 
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#2563eb';
