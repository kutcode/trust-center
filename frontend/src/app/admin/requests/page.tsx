'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { DocumentRequest } from '@/types';

export default function RequestsAdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');

  async function loadRequests(accessToken: string) {
    console.log('loadRequests: Starting API call...');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      console.log('loadRequests: API URL:', apiUrl);
      
      const data = await apiRequestWithAuth<DocumentRequest[]>('/api/admin/document-requests', accessToken);
      console.log('loadRequests: Success, got', data?.length, 'requests');
      setRequests(data);
      setError('');
    } catch (err: any) {
      console.error('loadRequests: Failed:', err);
      setError(err.message || 'Failed to load requests');
    }
  }

  useEffect(() => {
    async function init() {
      console.log('Requests page: Initializing...');
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Requests page: Session check result:', { hasSession: !!session, error: sessionError?.message });
      
      if (!session) {
        console.log('Requests page: No session, redirecting to login');
        router.push('/admin/login');
        return;
      }

      console.log('Requests page: Session found, loading requests...');
      setToken(session.access_token);
      await loadRequests(session.access_token);
      setLoading(false);
    }
    init();
  }, [router]);

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
    return <div className="text-gray-900">Loading...</div>;
  }

  return (
    <>
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Document Requests</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'pending' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'approved' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('denied')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'denied' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Denied
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-900 font-medium">{request.requester_name}</div>
                  <div className="text-sm text-gray-600 truncate max-w-xs">{request.requester_email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-900 max-w-xs truncate">{request.requester_company}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-md">
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
    </>
  );
}

