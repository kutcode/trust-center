import express from 'express';
import { supabase } from '../../server';
import { requireAdmin } from '../../middleware/auth';
import { handleError } from '../../utils/errorHandler';

const router = express.Router();

// Get activity logs with date filter
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { date, start_date, end_date, entity_type, action_type, limit } = req.query;

    const defaultLimit = (start_date && end_date) ? 1000 : 100;
    const queryLimit = limit ? Number(limit) : defaultLimit;

    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(queryLimit);

    if (start_date && end_date) {
      const startOfDay = `${start_date}T00:00:00.000Z`;
      const endOfDay = `${end_date}T23:59:59.999Z`;
      query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
    } else if (date) {
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;
      query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
    }

    if (entity_type) {
      query = query.eq('entity_type', entity_type);
    }

    if (action_type) {
      query = query.eq('action_type', action_type);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    handleError(res, error, 'Get activity logs error');
  }
});

// Get activity log stats for a date range
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    const { data, error } = await supabase
      .from('activity_logs')
      .select('created_at, action_type, entity_type')
      .gte('created_at', daysAgo.toISOString());

    if (error) throw error;

    const byDate: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const byEntity: Record<string, number> = {};

    (data || []).forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
      byAction[log.action_type] = (byAction[log.action_type] || 0) + 1;
      byEntity[log.entity_type] = (byEntity[log.entity_type] || 0) + 1;
    });

    res.json({
      totalLogs: data?.length || 0,
      byDate,
      byAction,
      byEntity,
    });
  } catch (error: any) {
    handleError(res, error, 'Get activity log stats error');
  }
});

export default router;
