-- Normalize document file paths to backend-local relative paths.
-- The backend resolves files with: path.join(UPLOADS_DIR, documents.file_url)
-- so leading "/" values break resolution.

-- Convert /uploads/documents/<file> => documents/<file>
UPDATE documents
SET file_url = regexp_replace(file_url, '^/uploads/documents/', 'documents/')
WHERE file_url ~ '^/uploads/documents/';

-- Convert /files/<file> => documents/<file>
UPDATE documents
SET file_url = regexp_replace(file_url, '^/files/', 'documents/')
WHERE file_url ~ '^/files/';

-- Convert any remaining /uploads/<path> => <path>
UPDATE documents
SET file_url = regexp_replace(file_url, '^/uploads/', '')
WHERE file_url ~ '^/uploads/';
