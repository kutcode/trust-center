-- Add banner_image to control_categories
ALTER TABLE public.control_categories 
ADD COLUMN IF NOT EXISTS banner_image TEXT;

-- Notify pnotify to reload schema cache (optional but good practice)
NOTIFY pgrst, 'reload schema';
