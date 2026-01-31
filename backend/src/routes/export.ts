import express from 'express';
import { supabase } from '../server';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { ExportService, ExportSection } from '../services/exportService';
import { handleError } from '../utils/errorHandler';
import { logActivity } from '../utils/activityLogger';

const router = express.Router();

/**
 * GET /api/export
 * Full Trust Center export (admin only)
 * Query params:
 *   - format: 'json' (default) or 'csv'
 *   - include: comma-separated list of sections (certifications,controls,documents,securityUpdates,subprocessors)
 *   - since: ISO date string for incremental export
 */
router.get('/', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { format = 'json', include, since } = req.query;

        const exportService = new ExportService(supabase);

        // Parse sections to include
        let sections: ExportSection[] | undefined;
        if (include && typeof include === 'string') {
            sections = include.split(',').map((s) => s.trim()) as ExportSection[];
        }

        // Parse since date for incremental exports
        let sinceDate: Date | undefined;
        if (since && typeof since === 'string') {
            sinceDate = new Date(since);
            if (isNaN(sinceDate.getTime())) {
                return res.status(400).json({ error: 'Invalid date format for "since" parameter' });
            }
        }

        const exportData = await exportService.exportAll({
            sections,
            since: sinceDate,
            adminEmail: req.admin?.email,
        });

        // Log the export activity
        await logActivity({
            adminId: req.admin!.id,
            adminEmail: req.admin!.email,
            actionType: 'export',
            entityType: 'trust_center',
            description: `Exported Trust Center data (format: ${format}, sections: ${sections ? sections.join(', ') : 'all'})`,
            newValue: {
                format,
                sections: sections || 'all',
                since: since || null,
            },
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
        });

        if (format === 'csv') {
            // For CSV, we need to pick a specific section
            return res.status(400).json({
                error: 'CSV format requires a specific section. Use /api/export/:section?format=csv',
            });
        }

        // Set headers for JSON download
        const filename = `trust-center-export-${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.json(exportData);
    } catch (error: any) {
        handleError(res, error, 'Export error');
    }
});

/**
 * GET /api/export/certifications
 * Export certifications only
 */
router.get('/certifications', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { format = 'json', since } = req.query;
        const exportService = new ExportService(supabase);

        let sinceDate: Date | undefined;
        if (since && typeof since === 'string') {
            sinceDate = new Date(since);
        }

        const data = await exportService.exportCertifications(sinceDate);

        if (format === 'csv') {
            const csvData = exportService.convertToCSV(data, 'certifications');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="certifications.csv"');
            return res.send(csvData);
        }

        res.json({ certifications: data });
    } catch (error: any) {
        handleError(res, error, 'Export certifications error');
    }
});

/**
 * GET /api/export/controls
 * Export controls and categories
 */
router.get('/controls', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { format = 'json', since } = req.query;
        const exportService = new ExportService(supabase);

        let sinceDate: Date | undefined;
        if (since && typeof since === 'string') {
            sinceDate = new Date(since);
        }

        const data = await exportService.exportControls(sinceDate);

        if (format === 'csv') {
            // Flatten controls for CSV
            const flattenedControls = data.categories.flatMap((cat) =>
                cat.controls.map((ctrl) => ({
                    categoryId: cat.id,
                    categoryName: cat.name,
                    categoryDescription: cat.description,
                    controlId: ctrl.id,
                    controlTitle: ctrl.title,
                    controlDescription: ctrl.description,
                    controlSortOrder: ctrl.sortOrder,
                }))
            );
            const csvData = exportService.convertToCSV(flattenedControls, 'controls');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="controls.csv"');
            return res.send(csvData);
        }

        res.json(data);
    } catch (error: any) {
        handleError(res, error, 'Export controls error');
    }
});

/**
 * GET /api/export/documents
 * Export document metadata (not file contents)
 */
router.get('/documents', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { format = 'json', since } = req.query;
        const exportService = new ExportService(supabase);

        let sinceDate: Date | undefined;
        if (since && typeof since === 'string') {
            sinceDate = new Date(since);
        }

        const data = await exportService.exportDocuments(sinceDate);

        if (format === 'csv') {
            const csvData = exportService.convertToCSV(data, 'documents');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="documents.csv"');
            return res.send(csvData);
        }

        res.json({ documents: data });
    } catch (error: any) {
        handleError(res, error, 'Export documents error');
    }
});

/**
 * GET /api/export/security-updates
 * Export security updates
 */
router.get('/security-updates', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { format = 'json', since } = req.query;
        const exportService = new ExportService(supabase);

        let sinceDate: Date | undefined;
        if (since && typeof since === 'string') {
            sinceDate = new Date(since);
        }

        const data = await exportService.exportSecurityUpdates(sinceDate);

        if (format === 'csv') {
            const csvData = exportService.convertToCSV(data, 'securityUpdates');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="security-updates.csv"');
            return res.send(csvData);
        }

        res.json({ securityUpdates: data });
    } catch (error: any) {
        handleError(res, error, 'Export security updates error');
    }
});

/**
 * GET /api/export/subprocessors
 * Export subprocessor list
 */
router.get('/subprocessors', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { format = 'json', since } = req.query;
        const exportService = new ExportService(supabase);

        let sinceDate: Date | undefined;
        if (since && typeof since === 'string') {
            sinceDate = new Date(since);
        }

        const data = await exportService.exportSubprocessors(sinceDate);

        if (format === 'csv') {
            const csvData = exportService.convertToCSV(data, 'subprocessors');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="subprocessors.csv"');
            return res.send(csvData);
        }

        res.json({ subprocessors: data });
    } catch (error: any) {
        handleError(res, error, 'Export subprocessors error');
    }
});

export default router;
