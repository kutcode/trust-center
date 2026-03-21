-- Compliance Frameworks table
CREATE TABLE IF NOT EXISTS public.frameworks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT,
    url TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Junction table: controls ↔ frameworks
CREATE TABLE IF NOT EXISTS public.control_framework_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    control_id UUID NOT NULL REFERENCES public.controls(id) ON DELETE CASCADE,
    framework_id UUID NOT NULL REFERENCES public.frameworks(id) ON DELETE CASCADE,
    reference_code TEXT,  -- e.g. "CC6.1", "A.8.2"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(control_id, framework_id)
);

-- Enable RLS
ALTER TABLE public.frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_framework_mappings ENABLE ROW LEVEL SECURITY;

-- Frameworks policies
CREATE POLICY "Allow public read access on frameworks"
    ON public.frameworks FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated insert on frameworks"
    ON public.frameworks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on frameworks"
    ON public.frameworks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on frameworks"
    ON public.frameworks FOR DELETE TO authenticated USING (true);

-- Mappings policies
CREATE POLICY "Allow public read access on control_framework_mappings"
    ON public.control_framework_mappings FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated insert on control_framework_mappings"
    ON public.control_framework_mappings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on control_framework_mappings"
    ON public.control_framework_mappings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on control_framework_mappings"
    ON public.control_framework_mappings FOR DELETE TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX idx_control_framework_mappings_control ON public.control_framework_mappings(control_id);
CREATE INDEX idx_control_framework_mappings_framework ON public.control_framework_mappings(framework_id);

-- Triggers
CREATE TRIGGER handle_updated_at_frameworks
    BEFORE UPDATE ON public.frameworks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant access for anonymous and authenticated roles
GRANT SELECT ON public.frameworks TO anon;
GRANT SELECT ON public.control_framework_mappings TO anon;
GRANT ALL ON public.frameworks TO authenticated;
GRANT ALL ON public.control_framework_mappings TO authenticated;
