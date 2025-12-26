import { supabase } from '../server';

export interface LogActivityParams {
    adminId: string;
    adminEmail: string;
    actionType: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    oldValue?: any;
    newValue?: any;
    description: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log an admin activity to the activity_logs table
 * This function never throws - logging failures are silently ignored
 * to prevent them from affecting the main operation
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
    try {
        await supabase.from('activity_logs').insert({
            admin_user_id: params.adminId,
            admin_email: params.adminEmail,
            action_type: params.actionType,
            entity_type: params.entityType,
            entity_id: params.entityId || null,
            entity_name: params.entityName || null,
            old_value: params.oldValue ? JSON.stringify(params.oldValue) : null,
            new_value: params.newValue ? JSON.stringify(params.newValue) : null,
            description: params.description,
            ip_address: params.ipAddress || null,
            user_agent: params.userAgent || null,
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw - logging should never break the main operation
    }
}
