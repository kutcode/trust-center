'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { Document } from '@/types';

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

  const handleDownload = (documentId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    window.open(`${apiUrl}/api/access/${token}/download/${documentId}`, '_blank');
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
      <h1 className="text-4xl font-bold mb-4">Document Access</h1>
      <p className="text-gray-600 mb-8">
        Welcome, {request.requester_name}. You have been granted access to the following documents:
      </p>

      <div className="space-y-4">
        {request.documents.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-6 hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">{doc.title}</h3>
            {doc.description && (
              <p className="text-gray-600 mb-4">{doc.description}</p>
            )}
            <button
              onClick={() => handleDownload(doc.id)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Download Document
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

