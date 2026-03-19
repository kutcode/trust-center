/**
 * Admin Routes Index
 *
 * This file composes all admin sub-route modules into a single router.
 * Each module handles a specific domain:
 *   - stats:         Dashboard statistics
 *   - requests:      Document request management (approve/deny/batch)
 *   - settings:      Trust center settings & branding
 *   - users:         Admin user management
 *   - organizations: Organization status & lifecycle
 *   - tickets:       Contact ticket management
 *   - activityLogs:  Audit / activity log queries
 *   - controls:      Security controls & control categories
 */

import express from 'express';

import statsRoutes from './admin/stats';
import requestRoutes from './admin/requests';
import settingsRoutes from './admin/settings';
import userRoutes from './admin/users';
import organizationRoutes from './admin/organizations';
import ticketRoutes from './admin/tickets';
import activityLogRoutes from './admin/activityLogs';
import controlRoutes from './admin/controls';

const router = express.Router();

// Mount sub-route modules
router.use('/', statsRoutes);
router.use('/document-requests', requestRoutes);
router.use('/settings', settingsRoutes);
router.use('/users', userRoutes);
router.use('/organizations', organizationRoutes);
router.use('/tickets', ticketRoutes);
router.use('/activity-logs', activityLogRoutes);

// Controls module handles both /control-categories/* and /controls/*
// via its internal path structure
router.use('/', controlRoutes);

export default router;
