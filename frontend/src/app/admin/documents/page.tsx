'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { Document, DocumentCategory } from '@/types';
import CategoriesModal from '@/components/admin/CategoriesModal';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import TableSkeleton from '@/components/ui/TableSkeleton';

type StatusFilter = 'all' | 'published' | 'draft' | 'archived';

export default function DocumentsAdminPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');

  async function loadData() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      setToken(session.access_token);
      try {
        const [docs, cats] = await Promise.all([
          apiRequestWithAuth<Document[]>('/api/documents?include_all_status=true', session.access_token),
          apiRequestWithAuth<DocumentCategory[]>('/api/document-categories', session.access_token),
        ]);
        setDocuments(docs);
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load data');
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!token || !deleteConfirm) return;

    setDeleting(deleteConfirm.id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/documents/${deleteConfirm.id}`,
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

      toast.success('Document deleted successfully');
      // Reload documents after deletion
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document');
    } finally {
      setDeleting(null);
      setDeleteConfirm(null);
    }
  };

  // Filter documents based on active tab
  const filteredDocuments = documents.filter(doc => {
    if (activeTab === 'all') return true;
    return doc.status === activeTab;
  });

  // Count documents by status
  const statusCounts = {
    all: documents.length,
    published: documents.filter(d => d.status === 'published').length,
    draft: documents.filter(d => d.status === 'draft').length,
    archived: documents.filter(d => d.status === 'archived').length,
  };

  if (loading) {
    return <div className="p-6"><TableSkeleton columns={5} rows={8} /></div>;
  }

  return (
    <>
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        isLoading={!!deleting}
      />

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

      {/* Status Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['all', 'published', 'draft', 'archived'] as StatusFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === tab
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
                  }`}>
                  {statusCounts[tab]}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {activeTab === 'all' ? 'No documents found' : `No ${activeTab} documents`}
              </h3>
              <p className="text-gray-500 mt-1">
                {activeTab === 'all'
                  ? 'Get started by uploading your first document.'
                  : `Documents with "${activeTab}" status will appear here.`}
              </p>
            </div>
          ) : (
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
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-gray-900 max-w-md truncate font-medium" title={doc.title}>{doc.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-sm text-gray-600">{doc.document_categories?.name || 'Uncategorized'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${doc.access_level === 'public' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {doc.access_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${doc.status === 'published'
                        ? 'bg-blue-100 text-blue-800'
                        : doc.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/admin/documents/${doc.id}`} className="text-blue-600 hover:text-blue-800 font-medium mr-4">
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm({ id: doc.id, title: doc.title })}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
