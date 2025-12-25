'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/lib/api';
import { Document, DocumentCategory } from '@/types';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import RequestDocumentModal from '@/components/RequestDocumentModal';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalDocument, setModalDocument] = useState<Document | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Documents</h1>
          <p className="text-lg text-gray-600 max-w-2xl mb-8">
            Access our compliance, security, and legal documents. Public documents are available immediately, while restricted documents require approval.
          </p>

          {/* Search Bar */}
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search documents by name or description..."
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="mb-8 border-b border-gray-200 bg-white rounded-t-lg px-4">
            <nav className="flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${selectedCategory === null
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                All Documents
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {documents.length}
                </span>
              </button>
              {categories.map((category) => {
                const count = documents.filter(doc => doc.category_id === category.id).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${selectedCategory === category.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {category.name}
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
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
            <p className="text-gray-600">
              Found <span className="font-semibold text-gray-900">{filteredDocuments.length}</span> document{filteredDocuments.length !== 1 ? 's' : ''} matching "<span className="font-medium">{searchQuery}</span>"
            </p>
            <button
              onClick={() => setSearchQuery('')}
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
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Public Documents</h2>
              <p className="text-gray-600 text-sm">Available for immediate download</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{getFileIcon(doc.file_type)}</div>
                    <span className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                      Public
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
                  {doc.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{doc.description}</p>
                  )}
                  <Link
                    href={`/documents/${doc.id}/download`}
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
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Restricted Documents</h2>
              <p className="text-gray-600 text-sm">Request access to view these documents</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restrictedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{getFileIcon(doc.file_type)}</div>
                    <span className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Restricted
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
                  {doc.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{doc.description}</p>
                  )}
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
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Try adjusting your search terms or clearing filters.'
                : selectedCategory
                  ? 'No documents available in this category.'
                  : 'No documents available at this time.'}
            </p>
          </div>
        )}
      </div>

      {/* Request Document Modal */}
      {modalDocument && (
        <RequestDocumentModal
          document={modalDocument}
          isOpen={!!modalDocument}
          onClose={() => setModalDocument(null)}
        />
      )}
    </div>
  );
}

