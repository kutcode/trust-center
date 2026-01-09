-- Create control_categories table
CREATE TABLE IF NOT EXISTS public.control_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create controls table
CREATE TABLE IF NOT EXISTS public.controls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.control_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.control_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controls ENABLE ROW LEVEL SECURITY;

-- Create policies for control_categories
CREATE POLICY "Allow public read access on control_categories"
    ON public.control_categories
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated insert on control_categories"
    ON public.control_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on control_categories"
    ON public.control_categories
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on control_categories"
    ON public.control_categories
    FOR DELETE
    TO authenticated
    USING (true);

-- Create policies for controls
CREATE POLICY "Allow public read access on controls"
    ON public.controls
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated insert on controls"
    ON public.controls
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on controls"
    ON public.controls
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on controls"
    ON public.controls
    FOR DELETE
    TO authenticated
    USING (true);

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at_control_categories
    BEFORE UPDATE ON public.control_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER handle_updated_at_controls
    BEFORE UPDATE ON public.controls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
