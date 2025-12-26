'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { apiRequestWithAuth } from '@/lib/api';

interface ActivityLog {
    id: string;
    admin_user_id: string;
    admin_email: string;
    action_type: string;
    entity_type: string;
    entity_id: string;
    entity_name: string;
    old_value: any;
    new_value: any;
    description: string;
    created_at: string;
}

export default function ActivityLogsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [entityFilter, setEntityFilter] = useState<string>('');
    const [actionFilter, setActionFilter] = useState<string>('');

    useEffect(() => {
        loadLogs();
    }, [selectedDate, entityFilter, actionFilter]);

    async function loadLogs() {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/admin/login');
                return;
            }

            let url = `/api/admin/activity-logs?date=${selectedDate}`;
            if (entityFilter) url += `&entity_type=${entityFilter}`;
            if (actionFilter) url += `&action_type=${actionFilter}`;

            const data = await apiRequestWithAuth<ActivityLog[]>(url, session.access_token);
            setLogs(data);
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setLoading(false);
        }
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'status_change':
                return 'bg-blue-100 text-blue-700';
            case 'approval':
                return 'bg-green-100 text-green-700';
            case 'denial':
                return 'bg-red-100 text-red-700';
            case 'create':
                return 'bg-purple-100 text-purple-700';
            case 'delete':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getEntityBadgeColor = (entity: string) => {
        switch (entity) {
            case 'organization':
                return 'bg-indigo-100 text-indigo-700';
            case 'document':
                return 'bg-amber-100 text-amber-700';
            case 'request':
                return 'bg-orange-100 text-orange-700';
            case 'ticket':
                return 'bg-teal-100 text-teal-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const downloadCSV = () => {
        if (logs.length === 0) return;

        // CSV headers
        const headers = ['Date', 'Time', 'Action Type', 'Entity Type', 'Entity Name', 'Description', 'Admin Email'];

        // CSV rows
        const rows = logs.map(log => {
            const date = new Date(log.created_at);
            return [
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                log.action_type,
                log.entity_type,
                log.entity_name || '',
                `"${(log.description || '').replace(/"/g, '""')}"`, // Escape quotes for CSV
                log.admin_email,
            ].join(',');
        });

        // Combine headers and rows
        const csvContent = [headers.join(','), ...rows].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `activity_logs_${selectedDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        View all admin actions and database changes
                    </p>
                </div>
                <button
                    onClick={downloadCSV}
                    disabled={logs.length === 0 || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download CSV
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Entity Type
                        </label>
                        <select
                            value={entityFilter}
                            onChange={(e) => setEntityFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Entities</option>
                            <option value="organization">Organization</option>
                            <option value="document">Document</option>
                            <option value="request">Request</option>
                            <option value="ticket">Ticket</option>
                            <option value="settings">Settings</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Action Type
                        </label>
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Actions</option>
                            <option value="status_change">Status Change</option>
                            <option value="approval">Approval</option>
                            <option value="denial">Denial</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                        </select>
                    </div>

                    <button
                        onClick={loadLogs}
                        className="mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">📋</div>
                        <h3 className="text-lg font-medium text-gray-900">No activity logs</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            No logs found for {selectedDate}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Entity
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Admin
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm font-mono text-gray-900">
                                                {formatTime(log.created_at)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeColor(log.action_type)}`}>
                                                {log.action_type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEntityBadgeColor(log.entity_type)}`}>
                                                    {log.entity_type}
                                                </span>
                                                {log.entity_name && (
                                                    <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                                        {log.entity_name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-900 max-w-md truncate">
                                                {log.description}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {log.admin_email}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary */}
            {!loading && logs.length > 0 && (
                <div className="text-sm text-gray-500 text-center">
                    Showing {logs.length} log{logs.length !== 1 ? 's' : ''} for {selectedDate}
                </div>
            )}
        </div>
    );
}
