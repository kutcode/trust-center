import express from 'express';
import { supabase } from '../../server';
import { requireAdmin, AuthRequest } from '../../middleware/auth';
import { handleError } from '../../utils/errorHandler';

const router = express.Router();

// Get dashboard statistics (admin only)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Get pending requests count
    const { count: pendingCount } = await supabase
      .from('document_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get total organizations count (active only)
    const { count: totalOrgsCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get organizations with approved documents
    const { data: orgs } = await supabase
      .from('organizations')
      .select('approved_document_ids, status')
      .eq('is_active', true);

    const approvedOrgsCount = orgs?.filter(org =>
      org.approved_document_ids && org.approved_document_ids.length > 0
    ).length || 0;

    // Get organization status counts
    const whitelistedCount = orgs?.filter(org => org.status === 'whitelisted').length || 0;
    const conditionalCount = orgs?.filter(org => org.status === 'conditional').length || 0;
    const noAccessCount = orgs?.filter(org => org.status === 'no_access').length || 0;

    // Get total published documents count
    const { count: totalDocsCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('is_current_version', true);

    // Get open tickets count (new or in_progress)
    const { count: openTicketsCount } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'in_progress']);

    res.json({
      pendingRequests: pendingCount || 0,
      totalOrganizations: totalOrgsCount || 0,
      openTickets: openTicketsCount || 0,
      totalDocuments: totalDocsCount || 0,
      organizationsByStatus: {
        whitelisted: whitelistedCount,
        conditional: conditionalCount,
        noAccess: noAccessCount,
      },
    });
  } catch (error: any) {
    handleError(res, error, 'Stats endpoint error');
  }
});

export default router;
