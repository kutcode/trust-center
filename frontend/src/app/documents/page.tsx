'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/lib/api';
import { Document, DocumentCategory } from '@/types';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import RequestDocumentModal from '@/components/RequestDocumentModal';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import LiveRegion from '@/components/ui/LiveRegion';
import { useQueryParam } from '@/hooks/useQueryParam';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [selectedCategoryParam, setSelectedCategoryParam] = useQueryParam('category');
  const [searchQueryParam, setSearchQueryParam] = useQueryParam('q');
  const selectedCategory = selectedCategoryParam;
  const searchQuery = searchQueryParam || '';
  const [loading, setLoading] = useState(true);
  const [modalDocument, setModalDocument] = useState<Document | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [docs, cats] = await Promise.all([
          apiRequest<Document[]>('/api/documents'),
          apiRequest<DocumentCategory[]>('/api/document-categories'),
        ]);
        setDocuments(docs.filter(doc => doc.status === 'published'));
        setCategories(cats.sort((a, b) => a.display_order - b.display_order));
      } catch (error) {
        console.error('Failed to load documents:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Scroll to document if hash is present in URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
          }, 2000);
        }
      }, 500);
    }
  }, [loading]);

  // Filter documents by category and search query
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(doc => doc.category_id === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        (doc.description && doc.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [documents, selectedCategory, searchQuery]);

  const publicDocs = filteredDocuments.filter(doc => doc.access_level === 'public');
  const restrictedDocs = filteredDocuments.filter(doc => doc.access_level === 'restricted');

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    return '📎';
  };

  const getFileTypeLabel = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCX';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'XLSX';
    if (mimeType.includes('text')) return 'TXT';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PPTX';
    return 'FILE';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const copyLinkToDocument = async (docId: string, docTitle: string) => {
    const url = `${window.location.origin}/documents#doc-${docId}`;
    try {
      await navigator.clipboard.writeText(url);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="flex gap-4 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-gray-200 rounded w-32"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <LiveRegion
        message={`Showing ${filteredDocuments.length} document${filteredDocuments.length === 1 ? '' : 's'}${selectedCategory ? ' in selected category' : ''}${searchQuery ? ` matching ${searchQuery}` : ''}.`}
      />
      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-12">
          <Breadcrumbs
            className="mb-4"
            items={[
              { label: 'Home', href: '/' },
              { label: 'Documents' },
            ]}
          />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Documents</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mb-8">
            Access our compliance, security, and legal documents. Public documents are available immediately, while restricted documents require approval.
          </p>

          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onSearch={(value) => setSearchQueryParam(value || null)}
            placeholder="Search documents by name or description..."
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="mb-8 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-t-lg px-4">
            <nav className="flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setSelectedCategoryParam(null)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${selectedCategory === null
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
              >
                All Documents
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full">
                  {documents.length}
                </span>
              </button>
              {categories.map((category) => {
                const count = documents.filter(doc => doc.category_id === category.id).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryParam(category.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${selectedCategory === category.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                  >
                    {category.name}
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full">
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-300">
              Found <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredDocuments.length}</span> document{filteredDocuments.length !== 1 ? 's' : ''} matching "<span className="font-medium">{searchQuery}</span>"
            </p>
            <button
              onClick={() => setSearchQueryParam(null)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Public Documents Section */}
        {publicDocs.length > 0 && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">Public Documents</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Available for immediate download</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicDocs.map((doc) => (
                <div
                  key={doc.id}
                  id={`doc-${doc.id}`}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="text-3xl">{getFileIcon(doc.file_type)}</div>
                      <span className="px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-800 rounded">
                        {getFileTypeLabel(doc.file_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyLinkToDocument(doc.id, doc.title)}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Copy link to this document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <span className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                        Public
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{doc.title}</h3>
                  {doc.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{doc.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Updated {formatDate(doc.updated_at)}
                    </div>
                  </div>
                  <Link
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/documents/${doc.id}/download`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm group"
                  >
                    Download
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Restricted Documents Section */}
        {restrictedDocs.length > 0 && (
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">Restricted Documents</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Request access to view these documents</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restrictedDocs.map((doc) => (
                <div
                  key={doc.id}
                  id={`doc-${doc.id}`}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="text-3xl">{getFileIcon(doc.file_type)}</div>
                      <span className="px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-800 rounded">
                        {getFileTypeLabel(doc.file_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyLinkToDocument(doc.id, doc.title)}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Copy link to this document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <span className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Restricted
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{doc.title}</h3>
                  {doc.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{doc.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Updated {formatDate(doc.updated_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => setModalDocument(doc)}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm group"
                  >
                    Request Access
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No documents found</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchQuery
                ? 'Try adjusting your search terms or clearing filters.'
                : selectedCategory
                  ? 'No documents available in this category.'
                  : 'No documents available at this time.'}
            </p>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 dark:bg-black text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up z-50 border border-transparent dark:border-slate-700">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">Link copied to clipboard!</span>
        </div>
      )}

      {/* Request Document Modal */}
      {modalDocument && (
        <RequestDocumentModal
          initialDocument={modalDocument}
          isOpen={!!modalDocument}
          onClose={() => setModalDocument(null)}
        />
      )}
    </div>
  );
}
