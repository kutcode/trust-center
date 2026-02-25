-- Add Salesforce identity metadata to the active connection row and persist sync audit history

ALTER TABLE public.salesforce_connections
  ADD COLUMN IF NOT EXISTS salesforce_user_id TEXT,
  ADD COLUMN IF NOT EXISTS salesforce_username TEXT,
  ADD COLUMN IF NOT EXISTS salesforce_display_name TEXT,
  ADD COLUMN IF NOT EXISTS salesforce_org_id TEXT,
  ADD COLUMN IF NOT EXISTS salesforce_org_name TEXT,
  ADD COLUMN IF NOT EXISTS salesforce_identity_url TEXT;

CREATE TABLE IF NOT EXISTS public.salesforce_sync_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES public.salesforce_connections(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  processed_accounts INTEGER NOT NULL DEFAULT 0,
  contacts_queried INTEGER NOT NULL DEFAULT 0,
  contacts_matched_accounts INTEGER NOT NULL DEFAULT 0,
  updated_organizations INTEGER NOT NULL DEFAULT 0,
  blocked_organizations INTEGER NOT NULL DEFAULT 0,
  skipped_domains INTEGER NOT NULL DEFAULT 0,
  status_field TEXT NOT NULL,
  domain_field TEXT NOT NULL,
  allowed_statuses TEXT[] NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.salesforce_sync_run_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES public.salesforce_sync_runs(id) ON DELETE CASCADE,
  salesforce_account_id TEXT NOT NULL,
  account_name TEXT,
  status_value TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('whitelisted', 'no_access', 'skipped')),
  website_domain TEXT,
  domains TEXT[] NOT NULL DEFAULT '{}',
  related_contact_count INTEGER NOT NULL DEFAULT 0,
  matched_contact_emails TEXT[] NOT NULL DEFAULT '{}',
  organizations_updated INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salesforce_sync_runs_created_at
  ON public.salesforce_sync_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_salesforce_sync_run_accounts_run_id
  ON public.salesforce_sync_run_accounts(run_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_salesforce_sync_runs_updated_at'
  ) THEN
    CREATE TRIGGER update_salesforce_sync_runs_updated_at
      BEFORE UPDATE ON public.salesforce_sync_runs
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

GRANT ALL ON TABLE public.salesforce_connections TO service_role;
GRANT ALL ON TABLE public.salesforce_sync_runs TO service_role;
GRANT ALL ON TABLE public.salesforce_sync_run_accounts TO service_role;
