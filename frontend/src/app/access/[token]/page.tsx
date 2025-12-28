'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { Document } from '@/types';
import NDAModal from '@/components/NDAModal';
import toast from 'react-hot-toast';

interface AccessResponse {
  request: {
    id: string;
    requester_name: string;
    documents: Document[];
  };
}

export default function AccessPage() {
  const params = useParams();
  const token = params.token as string;

  const [request, setRequest] = useState<AccessResponse['request'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NDA Logic
  const [showNDAModal, setShowNDAModal] = useState(false);
  const [pendingDocId, setPendingDocId] = useState<string | null>(null);
  const [isAcceptingNDA, setIsAcceptingNDA] = useState(false);

  useEffect(() => {
    async function fetchAccess() {
      try {
        const data = await apiRequest<AccessResponse>(`/api/access/${token}`);
        setRequest(data.request);
      } catch (err: any) {
        setError(err.message || 'Invalid or expired link');
      } finally {
        setLoading(false);
      }
    }
    fetchAccess();
  }, [token]);

  const downloadFile = async (documentId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/access/${token}/download/${documentId}`);

      if (response.status === 403) {
        const data = await response.json();
        if (data.error === 'NDA_REQUIRED') {
          setPendingDocId(documentId);
          setShowNDAModal(true);
          return;
        }
        throw new Error(data.error || 'Access denied');
      }

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Try to get filename from header
      const disposition = response.headers.get('Content-Disposition');
      let filename = 'document';
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err: any) {
      toast.error(err.message || 'Failed to download document');
    }
  };

  const handleDownload = (documentId: string) => {
    downloadFile(documentId);
  };

  const handleAcceptNDA = async () => {
    setIsAcceptingNDA(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/access/${token}/accept-nda`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to accept NDA');
      }

      toast.success('NDA Accepted');
      setShowNDAModal(false);
      setIsAcceptingNDA(false);

      // Retry pending download
      if (pendingDocId) {
        downloadFile(pendingDocId);
        setPendingDocId(null);
      }
    } catch (err: any) {
      setIsAcceptingNDA(false);
      toast.error(err.message || 'Error accepting NDA');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p>{error || 'This link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <NDAModal
        isOpen={showNDAModal}
        onClose={() => { setShowNDAModal(false); setPendingDocId(null); }}
        onAccept={handleAcceptNDA}
        isAccepting={isAcceptingNDA}
      />

      <h1 className="text-4xl font-bold mb-4">Document Access</h1>
      <p className="text-gray-600 mb-8">
        Welcome, {request.requester_name}. You have been granted access to the following documents:
      </p>

      <div className="space-y-4">
        {request.documents.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-6 hover:shadow-lg transition flex justify-between items-center group">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold">{doc.title}</h3>
                {doc.requires_nda && (
                  <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded">
                    NDA Required
                  </span>
                )}
              </div>
              {doc.description && (
                <p className="text-gray-600 mb-4">{doc.description}</p>
              )}
            </div>

            <button
              onClick={() => handleDownload(doc.id)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition ml-4"
            >
              Download
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This access link is time-limited. Please download the documents you need.
        </p>
      </div>
    </div>
  );
}
