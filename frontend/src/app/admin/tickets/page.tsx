'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Ticket {
    id: string;
    name: string;
    email: string;
    organization: string | null;
    subject: string;
    message: string;
    status: 'new' | 'in_progress' | 'resolved';
    priority: 'low' | 'normal' | 'high' | 'critical';
    message_count: number;
    created_at: string;
    updated_at: string;
    assigned_admin?: {
        id: string;
        email: string;
        full_name: string | null;
    } | null;
}

const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
};

const statusLabels = {
    new: 'New',
    in_progress: 'In Progress',
    resolved: 'Resolved',
};

const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700 ring-1 ring-red-400',
};

const priorityLabels = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    critical: 'Critical',
};

const priorityIcons = {
    low: '↓',
    normal: '●',
    high: '↑',
    critical: '⚠️',
};

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTickets();
    }, [statusFilter, priorityFilter]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            setError(null);

            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setError('Not authenticated');
                return;
            }

            let url = '/api/admin/tickets?';
            if (statusFilter !== 'all') url += `status=${statusFilter}&`;
            if (priorityFilter !== 'all') url += `priority=${priorityFilter}&`;

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${API_URL}${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            setTickets(data);
        } catch (err: any) {
            console.error('Failed to fetch tickets:', err);
            setError(err.message || 'Failed to fetch tickets');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Count high priority tickets
    const criticalCount = tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').length;
    const highCount = tickets.filter(t => t.priority === 'high' && t.status !== 'resolved').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
                    <p className="text-gray-600 mt-1">Manage contact form submissions and user inquiries</p>
                </div>
                {(criticalCount > 0 || highCount > 0) && (
                    <div className="flex gap-2">
                        {criticalCount > 0 && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                ⚠️ {criticalCount} Critical
                            </span>
                        )}
                        {highCount > 0 && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                                ↑ {highCount} High
                            </span>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="flex gap-1">
                        {['all', 'new', 'in_progress', 'resolved'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {status === 'all' ? 'All' : statusLabels[status as keyof typeof statusLabels]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Priority:</span>
                    <div className="flex gap-1">
                        {['all', 'critical', 'high', 'normal', 'low'].map((priority) => (
                            <button
                                key={priority}
                                onClick={() => setPriorityFilter(priority)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${priorityFilter === priority
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {priority === 'all' ? 'All' : priorityLabels[priority as keyof typeof priorityLabels]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No tickets found</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Priority
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    From
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Messages
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tickets.map((ticket) => (
                                <tr key={ticket.id} className={`hover:bg-gray-50 ${ticket.priority === 'critical' ? 'bg-red-50/50' : ''
                                    }`}>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${priorityColors[ticket.priority || 'normal']
                                            }`}>
                                            {priorityIcons[ticket.priority || 'normal']} {priorityLabels[ticket.priority || 'normal']}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                            {ticket.subject}
                                        </div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                            {ticket.message.substring(0, 60)}...
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{ticket.name}</div>
                                        <div className="text-sm text-gray-500">{ticket.email}</div>
                                        {ticket.organization && (
                                            <div className="text-xs text-gray-400">{ticket.organization}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[ticket.status]}`}>
                                            {statusLabels[ticket.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-900">
                                            {ticket.message_count > 0 ? (
                                                <span className="inline-flex items-center gap-1">
                                                    💬 {ticket.message_count}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {formatDate(ticket.created_at)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/admin/tickets/${ticket.id}`}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
