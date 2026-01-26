-- Migration: Add admin_nav_order column to trust_center_settings
-- This stores the custom order of navigation items in the admin sidebar

ALTER TABLE trust_center_settings 
ADD COLUMN IF NOT EXISTS admin_nav_order TEXT[] DEFAULT ARRAY[
    'dashboard',
    'controls',
    'documents',
    'certifications',
    'security-updates',
    'requests',
    'organizations',
    'users',
    'activity',
    'settings'
];
