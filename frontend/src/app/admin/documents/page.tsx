'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { Document, DocumentCategory } from '@/types';
import CategoriesModal from '@/components/admin/CategoriesModal';

export default function DocumentsAdminPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);

  async function loadData() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      setToken(session.access_token);
      try {
        const [docs, cats] = await Promise.all([
          apiRequestWithAuth<Document[]>('/api/documents', session.access_token),
          apiRequestWithAuth<DocumentCategory[]>('/api/document-categories', session.access_token),
        ]);
        setDocuments(docs);
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!token) return;

    if (!confirm(`Are you sure you want to delete "${docTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(docId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/documents/${docId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete document');
      }

      // Reload documents after deletion
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <div className="text-gray-900">Loading...</div>;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Document Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCategoriesModal(true)}
            className="bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors whitespace-nowrap flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Edit Categories
          </button>
          <Link
            href="/admin/documents/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Upload New Document
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 max-w-md truncate" title={doc.title}>{doc.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate">{doc.document_categories?.name || 'Uncategorized'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${doc.access_level === 'public' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {doc.access_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${doc.status === 'published' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link href={`/admin/documents/${doc.id}`} className="text-blue-600 hover:underline mr-4">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      disabled={deleting === doc.id}
                      className="text-red-600 hover:underline disabled:text-gray-400"
                    >
                      {deleting === doc.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Categories Modal */}
      {token && (
        <CategoriesModal
          isOpen={showCategoriesModal}
          onClose={() => setShowCategoriesModal(false)}
          token={token}
          onCategoriesUpdated={loadData}
        />
      )}
    </>
  );
}
