'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface TicketMessage {
    id: string;
    sender_type: 'admin' | 'user';
    sender_name: string | null;
    message: string;
    created_at: string;
    sender?: {
        id: string;
        email: string;
        full_name: string | null;
    } | null;
}

interface Ticket {
    id: string;
    name: string;
    email: string;
    organization: string | null;
    subject: string;
    message: string;
    status: 'new' | 'in_progress' | 'resolved';
    priority: 'low' | 'normal' | 'high' | 'critical';
    created_at: string;
    updated_at: string;
    messages: TicketMessage[];
    assigned_admin?: {
        id: string;
        email: string;
        full_name: string | null;
    } | null;
}

const statusColors = {
    new: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
};

const statusLabels = {
    new: 'New',
    in_progress: 'In Progress',
    resolved: 'Resolved',
};

const priorityColors = {
    low: 'bg-gray-100 text-gray-600 border-gray-200',
    normal: 'bg-blue-100 text-blue-700 border-blue-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
};

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyMessage, setReplyMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [updatingPriority, setUpdatingPriority] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params.id) {
            fetchTicket();
        }
    }, [params.id]);

    useEffect(() => {
        scrollToBottom();
    }, [ticket?.messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchTicket = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get auth token from Supabase session
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setError('Not authenticated');
                return;
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${API_URL}/api/admin/tickets/${params.id}`, {
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
            setTicket(data);
        } catch (error: any) {
            console.error('Failed to fetch ticket:', error);
            setError(error.message || 'Failed to fetch ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyMessage.trim() || sending) return;

        try {
            setSending(true);

            // Get auth token
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                alert('Not authenticated');
                return;
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${API_URL}/api/admin/tickets/${params.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ message: replyMessage }),
            });

            if (!response.ok) {
                throw new Error('Failed to send reply');
            }

            setReplyMessage('');
            fetchTicket(); // Refresh to get new message
        } catch (error) {
            console.error('Failed to send reply:', error);
            alert('Failed to send reply. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!ticket || updatingStatus) return;

        try {
            setUpdatingStatus(true);

            // Get auth token
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                alert('Not authenticated');
                return;
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${API_URL}/api/admin/tickets/${params.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            setTicket({ ...ticket, status: newStatus as Ticket['status'] });
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status. Please try again.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handlePriorityChange = async (newPriority: string) => {
        if (!ticket || updatingPriority) return;

        try {
            setUpdatingPriority(true);

            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                alert('Not authenticated');
                return;
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${API_URL}/api/admin/tickets/${params.id}/priority`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ priority: newPriority }),
            });

            if (!response.ok) {
                throw new Error('Failed to update priority');
            }

            setTicket({ ...ticket, priority: newPriority as Ticket['priority'] });
        } catch (error) {
            console.error('Failed to update priority:', error);
            alert('Failed to update priority. Please try again.');
        } finally {
            setUpdatingPriority(false);
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

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-500">Ticket not found</p>
                <Link href="/admin/tickets" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
                    ← Back to Tickets
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link href="/admin/tickets" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                    ← Back to Tickets
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
                        <p className="text-gray-500 mt-1">Submitted {formatDate(ticket.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={ticket.priority || 'normal'}
                            onChange={(e) => handlePriorityChange(e.target.value)}
                            disabled={updatingPriority}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border ${priorityColors[ticket.priority || 'normal']} ${updatingPriority ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <option value="low">🡇 Low</option>
                            <option value="normal">● Normal</option>
                            <option value="high">🡅 High</option>
                            <option value="critical">⚠️ Critical</option>
                        </select>
                        <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={updatingStatus}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border ${statusColors[ticket.status]} ${updatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Ticket Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500 block">From</span>
                        <span className="font-medium text-gray-900">{ticket.name}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Email</span>
                        <a href={`mailto:${ticket.email}`} className="font-medium text-blue-600 hover:text-blue-800">
                            {ticket.email}
                        </a>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Organization</span>
                        <span className="font-medium text-gray-900">{ticket.organization || '—'}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Assigned To</span>
                        <span className="font-medium text-gray-900">
                            {ticket.assigned_admin?.full_name || ticket.assigned_admin?.email || 'Unassigned'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Original Message */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Original Message</h3>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {ticket.message}
                </div>
            </div>

            {/* Conversation Thread */}
            {ticket.messages.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Conversation</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {ticket.messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`p-4 rounded-lg ${msg.sender_type === 'admin'
                                    ? 'bg-blue-50 border border-blue-100 ml-8'
                                    : 'bg-gray-50 border border-gray-100 mr-8'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {msg.sender_type === 'admin'
                                            ? `${msg.sender?.full_name || msg.sender_name || 'Support'}`
                                            : ticket.name}
                                    </span>
                                    <span className="text-xs text-gray-500">{formatDate(msg.created_at)}</span>
                                </div>
                                <div className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* Reply Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Send Reply</h3>
                <form onSubmit={handleSendReply}>
                    <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply here... (This will be sent via email to the user)"
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white"
                        disabled={sending}
                    />
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-500">
                            📧 Reply will be sent to {ticket.email}
                        </p>
                        <button
                            type="submit"
                            disabled={!replyMessage.trim() || sending}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {sending ? 'Sending...' : 'Send Reply'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
