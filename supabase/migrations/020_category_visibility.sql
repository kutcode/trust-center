-- Add is_hidden column to document_categories table
ALTER TABLE document_categories 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN document_categories.is_hidden IS 'When true, hides the category from public frontend display';
