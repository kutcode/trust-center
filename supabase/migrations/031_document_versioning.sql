-- Document Reviews table
CREATE TABLE IF NOT EXISTS public.document_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('approved', 'needs_changes', 'pending')) DEFAULT 'pending',
    notes TEXT,
    next_review_date DATE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add expiration and review cycle fields to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS review_cycle_days INTEGER;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS last_reviewed_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.document_reviews ENABLE ROW LEVEL SECURITY;

-- Document reviews policies
CREATE POLICY "Allow public read access on document_reviews"
    ON public.document_reviews FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated insert on document_reviews"
    ON public.document_reviews FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on document_reviews"
    ON public.document_reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on document_reviews"
    ON public.document_reviews FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_document_reviews_document ON public.document_reviews(document_id);
CREATE INDEX idx_document_reviews_reviewer ON public.document_reviews(reviewer_id);
CREATE INDEX idx_documents_expires_at ON public.documents(expires_at);
CREATE INDEX idx_documents_review_cycle ON public.documents(review_cycle_days);

-- Grants
GRANT SELECT ON public.document_reviews TO anon;
GRANT ALL ON public.document_reviews TO authenticated;
