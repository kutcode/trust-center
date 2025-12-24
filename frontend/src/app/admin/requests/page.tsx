'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { DocumentRequest } from '@/types';

export default function RequestsAdminPage() {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');

  useEffect(() => {
    async function loadRequests() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setToken(session.access_token);
        try {
          const data = await apiRequestWithAuth<DocumentRequest[]>('/api/admin/document-requests', session.access_token);
          setRequests(data);
        } catch (error) {
          console.error('Failed to load requests:', error);
        }
      }
      setLoading(false);
    }
    loadRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    if (!token) return;
    
    try {
      await apiRequestWithAuth(`/api/admin/document-requests/${requestId}/approve`, token, {
        method: 'PATCH',
        body: JSON.stringify({}),
      });
      // Reload requests
      const data = await apiRequestWithAuth<DocumentRequest[]>('/api/admin/document-requests', token);
      setRequests(data);
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleDeny = async (requestId: string) => {
    if (!token) return;
    
    const reason = prompt('Reason for denial (optional):');
    try {
      await apiRequestWithAuth(`/api/admin/document-requests/${requestId}/deny`, token, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      // Reload requests
      const data = await apiRequestWithAuth<DocumentRequest[]>('/api/admin/document-requests', token);
      setRequests(data);
    } catch (error) {
      console.error('Failed to deny request:', error);
    }
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  if (loading) {
    return <div className="container mx-auto px-4 py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Document Requests</h1>

      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded ${filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('denied')}
          className={`px-4 py-2 rounded ${filter === 'denied' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Denied
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requester</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4">
                  <div>{request.requester_name}</div>
                  <div className="text-sm text-gray-500">{request.requester_email}</div>
                </td>
                <td className="px-6 py-4">{request.requester_company}</td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    {request.documents?.map(doc => doc.title).join(', ') || `${request.document_ids.length} document(s)`}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    request.status === 'approved' || request.status === 'auto_approved' ? 'bg-green-100 text-green-800' :
                    request.status === 'denied' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="text-green-600 hover:underline"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeny(request.id)}
                        className="text-red-600 hover:underline"
                      >
                        Deny
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

