-- Update all documents to:
-- 1. Require NDA approval
-- 2. Set access to restricted
-- 3. Update file paths to point to actual files in uploads/documents

-- First, set all documents to require NDA and be restricted access
UPDATE documents SET 
    requires_nda = true,
    access_level = 'restricted'
WHERE is_current_version = true;

-- Update specific documents with matching file paths
UPDATE documents SET 
    file_url = '/uploads/documents/security_policy.pdf',
    file_name = 'security_policy.pdf'
WHERE title ILIKE '%security%policy%' AND is_current_version = true;

UPDATE documents SET 
    file_url = '/uploads/documents/privacy_policy.pdf',
    file_name = 'privacy_policy.pdf'
WHERE title ILIKE '%privacy%policy%' AND is_current_version = true;

UPDATE documents SET 
    file_url = '/uploads/documents/acceptable_use.pdf',
    file_name = 'acceptable_use.pdf'
WHERE title ILIKE '%acceptable%use%' AND is_current_version = true;

UPDATE documents SET 
    file_url = '/uploads/documents/data_processing.pdf',
    file_name = 'data_processing.pdf'
WHERE title ILIKE '%data%processing%' AND is_current_version = true;

UPDATE documents SET 
    file_url = '/uploads/documents/incident_response.pdf',
    file_name = 'incident_response.pdf'
WHERE title ILIKE '%incident%response%' AND is_current_version = true;

UPDATE documents SET 
    file_url = '/uploads/documents/soc2_report.pdf',
    file_name = 'soc2_report.pdf'
WHERE title ILIKE '%soc%2%' AND is_current_version = true;

UPDATE documents SET 
    file_url = '/uploads/documents/penetration_test.pdf',
    file_name = 'penetration_test.pdf'
WHERE title ILIKE '%penetration%test%' AND is_current_version = true;

UPDATE documents SET 
    file_url = '/uploads/documents/disaster_recovery.pdf',
    file_name = 'disaster_recovery.pdf'
WHERE (title ILIKE '%disaster%recovery%' OR title ILIKE '%business%continuity%') AND is_current_version = true;

-- For any remaining documents without a matching file, set a default
UPDATE documents SET 
    file_url = '/uploads/documents/security_policy.pdf',
    file_name = 'security_policy.pdf'
WHERE file_url LIKE '/files/%' AND is_current_version = true;
