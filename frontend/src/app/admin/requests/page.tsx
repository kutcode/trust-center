'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { DocumentRequest } from '@/types';
import Pagination from '@/components/ui/Pagination';
import SortableHeader from '@/components/ui/SortableHeader';
import { usePagination } from '@/hooks/usePagination';
import { useTableSort } from '@/hooks/useTableSort';
import { useQueryParam } from '@/hooks/useQueryParam';
import InputModal from '@/components/ui/InputModal';
import LiveRegion from '@/components/ui/LiveRegion';
import ProgressBar from '@/components/ui/ProgressBar';

// Extend DocumentRequest type to include expiration fields
interface ExtendedDocumentRequest extends DocumentRequest {
  access_expires_at?: string;
  expiration_days?: number;
}

export default function RequestsAdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ExtendedDocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [filterParam, setFilterParam] = useQueryParam('status');
  const filter: 'all' | 'pending' | 'approved' | 'denied' =
    filterParam === 'pending' || filterParam === 'approved' || filterParam === 'denied'
      ? filterParam
      : 'all';

  // Approval modal state
  const [approvalModal, setApprovalModal] = useState<{
    requestId: string;
    requesterName: string;
  } | null>(null);
  const [expirationDays, setExpirationDays] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);
  const [denyModal, setDenyModal] = useState<
    | { mode: 'single'; requestId: string; requesterName: string }
    | { mode: 'bulk'; count: number }
    | null
  >(null);
  const [denying, setDenying] = useState(false);

  async function loadRequests(accessToken: string) {
    try {
      const data = await apiRequestWithAuth<ExtendedDocumentRequest[]>('/api/admin/document-requests', accessToken);
      setRequests(data);
      setSelectedIds(new Set());
      setError('');
    } catch (err: any) {
      console.error('loadRequests: Failed:', err);
      setError(err.message || 'Failed to load requests');
    }
  }

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/admin/login');
        return;
      }

      setToken(session.access_token);
      await loadRequests(session.access_token);
      setLoading(false);
    }
    init();
  }, [router]);

  const handleApproveClick = (requestId: string, requesterName: string) => {
    setApprovalModal({ requestId, requesterName });
    setExpirationDays(null);
  };

  const handleApproveConfirm = async () => {
    if (!token || !approvalModal) return;

    setApproving(true);
    try {
      await apiRequestWithAuth(`/api/admin/document-requests/${approvalModal.requestId}/approve`, token, {
        method: 'PATCH',
        body: JSON.stringify({ expiration_days: expirationDays }),
      });
      await loadRequests(token);
      setApprovalModal(null);
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setApproving(false);
    }
  };

  const openDenyModal = (request: { id: string; requester_name: string }) => {
    setDenyModal({ mode: 'single', requestId: request.id, requesterName: request.requester_name });
  };

  // Bulk operations
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const selectedPendingIds = Array.from(selectedIds).filter(id =>
    pendingRequests.some(r => r.id === id)
  );

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedPendingIds.length === pendingRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRequests.map(r => r.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (!token || selectedPendingIds.length === 0) return;

    setBulkProcessing(true);
    try {
      await apiRequestWithAuth('/api/admin/document-requests/batch-approve', token, {
        method: 'POST',
        body: JSON.stringify({ request_ids: selectedPendingIds }),
      });
      await loadRequests(token);
    } catch (error) {
      console.error('Failed to bulk approve:', error);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDeny = async () => {
    if (!token || selectedPendingIds.length === 0) return;
    setDenyModal({ mode: 'bulk', count: selectedPendingIds.length });
  };

  const handleDenyConfirm = async (reason: string) => {
    if (!token || !denyModal) return;

    setDenying(true);
    if (denyModal.mode === 'bulk') {
      setBulkProcessing(true);
    }

    try {
      if (denyModal.mode === 'single') {
        await apiRequestWithAuth(`/api/admin/document-requests/${denyModal.requestId}/deny`, token, {
          method: 'PATCH',
          body: JSON.stringify({ reason }),
        });
      } else {
        await apiRequestWithAuth('/api/admin/document-requests/batch-deny', token, {
          method: 'POST',
          body: JSON.stringify({ request_ids: selectedPendingIds, reason }),
        });
      }
      await loadRequests(token);
      setDenyModal(null);
    } catch (error) {
      console.error('Failed to deny request(s):', error);
    } finally {
      setDenying(false);
      setBulkProcessing(false);
    }
  };

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);
  const { sortedItems: sortedRequests, sortField, sortDirection, toggleSort } = useTableSort<ExtendedDocumentRequest>(
    filteredRequests,
    'created_at',
    'desc'
  );
  const pagination = usePagination(sortedRequests, 10);

  const formatExpiration = (expiresAt: string | undefined) => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { label: 'Expired', color: 'text-red-600' };
    } else if (daysLeft <= 7) {
      return { label: `${daysLeft}d left`, color: 'text-orange-600' };
    } else {
      return { label: date.toLocaleDateString(), color: 'text-gray-500' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LiveRegion
        message={`Showing ${filteredRequests.length} document request${filteredRequests.length === 1 ? '' : 's'} for ${filter} status.`}
      />
      <InputModal
        key={denyModal ? `${denyModal.mode}-${denyModal.mode === 'single' ? denyModal.requestId : denyModal.count}` : 'deny-closed'}
        isOpen={!!denyModal}
        onClose={() => setDenyModal(null)}
        onConfirm={handleDenyConfirm}
        title={denyModal?.mode === 'bulk' ? 'Bulk Deny Requests' : 'Deny Request'}
        message={
          denyModal?.mode === 'bulk'
            ? `Add an optional denial reason for ${denyModal.count} selected request${denyModal.count === 1 ? '' : 's'}.`
            : denyModal?.mode === 'single'
              ? `Add an optional denial reason for ${denyModal.requesterName}.`
              : undefined
        }
        placeholder="Reason for denial (optional)"
        confirmLabel={denyModal?.mode === 'bulk' ? 'Deny Selected' : 'Deny Request'}
        isLoading={denying}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Document Requests</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage access requests from users
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-950/40 border border-red-400 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'denied'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterParam(f === 'all' ? null : f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedPendingIds.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              {selectedPendingIds.length} request{selectedPendingIds.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
            <button
              onClick={handleBulkApprove}
              disabled={bulkProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {bulkProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Approve All
            </button>
            <button
              onClick={handleBulkDeny}
              disabled={bulkProcessing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Deny All
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-100 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-slate-600"
            >
              Clear
            </button>
            </div>
          </div>
          {bulkProcessing && (
            <ProgressBar
              indeterminate
              label="Processing selected requests..."
            />
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                {filter === 'pending' && pendingRequests.length > 0 && (
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedPendingIds.length === pendingRequests.length && pendingRequests.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </th>
                )}
                <SortableHeader label="Requester" active={sortField === 'requester_name'} direction={sortDirection} onClick={() => toggleSort('requester_name')} className="px-6 py-3" />
                <SortableHeader label="Company" active={sortField === 'requester_company'} direction={sortDirection} onClick={() => toggleSort('requester_company')} className="px-6 py-3" />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Documents</th>
                <SortableHeader label="Status" active={sortField === 'status'} direction={sortDirection} onClick={() => toggleSort('status')} className="px-6 py-3" />
                <SortableHeader label="Created" active={sortField === 'created_at'} direction={sortDirection} onClick={() => toggleSort('created_at')} className="px-6 py-3" />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={filter === 'pending' && pendingRequests.length > 0 ? 7 : 6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No requests found
                  </td>
                </tr>
              ) : (
                pagination.paginatedItems.map((request) => {
                  const expInfo = formatExpiration(request.access_expires_at);
                  return (
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/80">
                      {filter === 'pending' && pendingRequests.length > 0 && (
                        <td className="px-4 py-4">
                          {request.status === 'pending' && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(request.id)}
                              onChange={() => toggleSelect(request.id)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 dark:text-gray-100 font-medium">{request.requester_name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-xs">{request.requester_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-gray-100 max-w-xs truncate">{request.requester_company}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100 max-w-md">
                          {request.documents && request.documents.length > 0 ? (
                            <div className="space-y-1">
                              {request.documents.map((doc, idx) => (
                                <div key={idx} className="truncate" title={doc.title}>
                                  {doc.title}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span>{request.document_ids?.length || 0} document(s)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${request.status === 'approved' || request.status === 'auto_approved'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'denied'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                        <div className="text-sm text-gray-700 dark:text-gray-300">{new Date(request.created_at).toLocaleDateString()}</div>
                        {(request.status === 'approved' || request.status === 'auto_approved') ? (
                          expInfo ? (
                            <span className={`text-sm ${expInfo.color}`}>
                              {expInfo.label}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">Permanent</span>
                          )
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveClick(request.id, request.requester_name)}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openDenyModal(request)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          onPageChange={pagination.setPage}
        />
      </div>

      {/* Approval Modal with Expiration Options */}
      {approvalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Approve Request</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Approve access for <strong>{approvalModal.requesterName}</strong>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Access Duration
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: null, label: '⟳ Permanent' },
                  { value: 7, label: '7 Days' },
                  { value: 30, label: '30 Days' },
                  { value: 90, label: '90 Days' },
                ].map((option) => (
                  <button
                    key={option.value ?? 'permanent'}
                    onClick={() => setExpirationDays(option.value)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${expirationDays === option.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-950 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {expirationDays && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Access will expire on{' '}
                  {new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setApprovalModal(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                disabled={approving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {approving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
