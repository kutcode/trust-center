-- Feature toggles and notification settings
ALTER TABLE trust_center_settings ADD COLUMN IF NOT EXISTS support_tickets_enabled BOOLEAN DEFAULT true;
ALTER TABLE trust_center_settings ADD COLUMN IF NOT EXISTS notify_on_new_request BOOLEAN DEFAULT true;
ALTER TABLE trust_center_settings ADD COLUMN IF NOT EXISTS notification_emails TEXT[] DEFAULT '{}';
