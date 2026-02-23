-- Ensure new "integrations" admin nav item exists in stored nav order

UPDATE trust_center_settings
SET admin_nav_order = CASE
    WHEN admin_nav_order IS NULL THEN ARRAY[
      'dashboard',
      'controls',
      'documents',
      'certifications',
      'security-updates',
      'requests',
      'organizations',
      'users',
      'activity',
      'integrations',
      'settings'
    ]
    WHEN array_position(admin_nav_order, 'integrations') IS NULL THEN admin_nav_order || ARRAY['integrations']
    ELSE admin_nav_order
END;

-- For future inserts
ALTER TABLE trust_center_settings
ALTER COLUMN admin_nav_order SET DEFAULT ARRAY[
  'dashboard',
  'controls',
  'documents',
  'certifications',
  'security-updates',
  'requests',
  'organizations',
  'users',
  'activity',
  'integrations',
  'settings'
];
