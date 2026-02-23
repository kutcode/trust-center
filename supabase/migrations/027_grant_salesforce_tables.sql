-- Ensure backend service role can access Salesforce integration tables

GRANT ALL ON TABLE public.integration_settings TO service_role;
GRANT ALL ON TABLE public.salesforce_connections TO service_role;
