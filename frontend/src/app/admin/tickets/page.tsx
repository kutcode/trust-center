'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { ContactSubmission, TicketMessage } from '@/types';
import Pagination from '@/components/ui/Pagination';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 15;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'normal': return 'bg-blue-100 text-blue-800';
    case 'low': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'new': return 'bg-yellow-100 text-yellow-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'new': return 'New';
    case 'in_progress': return 'In Progress';
    case 'resolved': return 'Resolved';
    default: return status;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TicketDetail extends ContactSubmission {
  messages: TicketMessage[];
}

export default function TicketsAdminPage() {
  const [tickets, setTickets] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Expanded ticket detail
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setToken(session.access_token);
        await loadTickets(session.access_token);
      }
      setLoading(false);
    }
    init();
  }, []);

  async function loadTickets(authToken?: string) {
    const t = authToken || token;
    if (!t) return;

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);

      const data = await apiRequestWithAuth<ContactSubmission[]>(
        `/api/admin/tickets?${params.toString()}`,
        t
      );
      setTickets(data);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      toast.error('Failed to load tickets');
    }
  }

  useEffect(() => {
    if (token) {
      loadTickets();
      setCurrentPage(1);
    }
  }, [statusFilter, priorityFilter]);

  async function loadTicketDetail(id: string) {
    if (!token) return;
    setDetailLoading(true);
    try {
      const data = await apiRequestWithAuth<TicketDetail>(`/api/admin/tickets/${id}`, token);
      setTicketDetail(data);
    } catch (error) {
      console.error('Failed to load ticket detail:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleToggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setTicketDetail(null);
      setReplyText('');
      return;
    }
    setExpandedId(id);
    setReplyText('');
    await loadTicketDetail(id);
  }

  async function handleStatusChange(id: string, status: string) {
    if (!token) return;
    try {
      await apiRequestWithAuth(`/api/admin/tickets/${id}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success(`Status updated to ${getStatusLabel(status)}`);
      await loadTickets();
      if (expandedId === id) {
        await loadTicketDetail(id);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  }

  async function handlePriorityChange(id: string, priority: string) {
    if (!token) return;
    try {
      await apiRequestWithAuth(`/api/admin/tickets/${id}/priority`, token, {
        method: 'PATCH',
        body: JSON.stringify({ priority }),
      });
      toast.success(`Priority updated to ${priority}`);
      await loadTickets();
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error('Failed to update priority');
    }
  }

  async function handleReply(id: string) {
    if (!token || !replyText.trim()) return;
    setReplying(true);
    try {
      await apiRequestWithAuth(`/api/admin/tickets/${id}/messages`, token, {
        method: 'POST',
        body: JSON.stringify({ message: replyText.trim() }),
      });
      toast.success('Reply sent');
      setReplyText('');
      await loadTicketDetail(id);
      await loadTickets();
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setReplying(false);
    }
  }

  // Pagination
  const totalPages = Math.ceil(tickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = tickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage contact form submissions and support conversations
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {paginatedTickets.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">
              <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No tickets found</h3>
            <p className="text-gray-500 text-sm">No support tickets match your filters.</p>
          </div>
        ) : (
          <div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">From</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Messages</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td colSpan={6} className="p-0">
                      {/* Ticket Row */}
                      <button
                        onClick={() => handleToggleExpand(ticket.id)}
                        className="w-full text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="flex-1 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <svg
                                className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === ticket.id ? 'rotate-90' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="font-medium text-gray-900 text-sm">{ticket.subject}</span>
                            </div>
                          </div>
                          <div className="px-4 py-3 min-w-[180px]">
                            <p className="text-sm text-gray-900">{ticket.name}</p>
                            <p className="text-xs text-gray-500">{ticket.email}</p>
                          </div>
                          <div className="px-4 py-3 min-w-[100px]">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <div className="px-4 py-3 min-w-[110px]">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {getStatusLabel(ticket.status)}
                            </span>
                          </div>
                          <div className="px-4 py-3 min-w-[80px]">
                            <span className="text-sm text-gray-600">{ticket.message_count || 0}</span>
                          </div>
                          <div className="px-4 py-3 min-w-[160px]">
                            <span className="text-sm text-gray-500">{formatDate(ticket.created_at)}</span>
                          </div>
                        </div>
                      </button>

                      {/* Expanded Detail */}
                      {expandedId === ticket.id && (
                        <div className="border-t border-gray-100 bg-gray-50 p-6">
                          {detailLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                            </div>
                          ) : ticketDetail ? (
                            <div className="space-y-4">
                              {/* Original Message */}
                              <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <p className="font-medium text-gray-900">{ticketDetail.name}</p>
                                    <p className="text-sm text-gray-500">{ticketDetail.email}{ticketDetail.organization ? ` - ${ticketDetail.organization}` : ''}</p>
                                  </div>
                                  <span className="text-xs text-gray-400">{formatDate(ticketDetail.created_at)}</span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticketDetail.message}</p>
                              </div>

                              {/* Message Thread */}
                              {ticketDetail.messages.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold text-gray-700">Conversation</h4>
                                  {ticketDetail.messages.map((msg) => (
                                    <div
                                      key={msg.id}
                                      className={`rounded-lg border p-3 ${
                                        msg.sender_type === 'admin'
                                          ? 'bg-blue-50 border-blue-200 ml-8'
                                          : 'bg-white border-gray-200 mr-8'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-700">
                                          {msg.sender_name || (msg.sender?.full_name || msg.sender?.email || 'Admin')}
                                        </span>
                                        <span className="text-xs text-gray-400">{formatDate(msg.created_at)}</span>
                                      </div>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Actions + Reply */}
                              <div className="flex flex-wrap gap-3 items-start">
                                <div className="flex gap-2">
                                  <select
                                    value={ticketDetail.status}
                                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                    className="px-2 py-1.5 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="new">New</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                  </select>
                                  <select
                                    value={ticketDetail.priority}
                                    onChange={(e) => handlePriorityChange(ticket.id, e.target.value)}
                                    className="px-2 py-1.5 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                  </select>
                                </div>
                              </div>

                              {/* Reply Box */}
                              {ticketDetail.status !== 'resolved' && (
                                <div className="flex gap-2">
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply..."
                                    rows={3}
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                  />
                                  <button
                                    onClick={() => handleReply(ticket.id)}
                                    disabled={replying || !replyText.trim()}
                                    className="self-end px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {replying ? 'Sending...' : 'Reply'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-4 py-3">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
