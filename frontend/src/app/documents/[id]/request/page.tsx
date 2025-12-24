'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { Document } from '@/types';

export default function RequestDocumentPage() {
  const params = useParams();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    reason: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function fetchDocument() {
      try {
        const doc = await apiRequest<Document>(`/api/documents/${documentId}`);
        setDocument(doc);
      } catch (error) {
        setStatus('error');
        setErrorMessage('Document not found');
      }
    }
    fetchDocument();
  }, [documentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await apiRequest<{ success: boolean; message: string }>('/api/document-requests', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          document_ids: [documentId],
        }),
      });
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        company: '',
        reason: '',
      });
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to submit request');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!document) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-4xl font-bold mb-4">Request Document Access</h1>
      <p className="text-gray-600 mb-8">
        Requesting access to: <strong>{document.title}</strong>
      </p>

      {status === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          Your request has been submitted! If your organization is approved, you'll receive an email with access instructions shortly.
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {errorMessage || 'Failed to submit request. Please try again.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            We'll send the access link to this email address
          </p>
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium mb-2">
            Company Name *
          </label>
          <input
            type="text"
            id="company"
            name="company"
            required
            value={formData.company}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium mb-2">
            Reason for Request *
          </label>
          <textarea
            id="reason"
            name="reason"
            required
            rows={4}
            value={formData.reason}
            onChange={handleChange}
            placeholder="Please explain why you need access to this document..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {status === 'submitting' ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}

