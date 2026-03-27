-- Add missing indexes on frequently-queried columns

-- documents: filtered by category_id and status on every listing
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- document_requests: filtered by organization in admin views
CREATE INDEX IF NOT EXISTS idx_document_requests_organization_id ON document_requests(organization_id);

-- document_requests: looked up by magic_link_token on every access link visit
CREATE INDEX IF NOT EXISTS idx_document_requests_magic_link_token ON document_requests(magic_link_token);

-- document_requests: filtered by status in admin views
CREATE INDEX IF NOT EXISTS idx_document_requests_status ON document_requests(status);
