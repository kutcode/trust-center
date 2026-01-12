'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Document, DocumentCategory } from '@/types';

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [document, setDocument] = useState<Document | null>(null);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [token, setToken] = useState<string | null>(null);

  // File replacement state
  const [fileRemoved, setFileRemoved] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    access_level: 'restricted',
    status: 'published',
    requires_nda: false,
  });

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/admin/login');
        return;
      }

      setToken(session.access_token);

      try {
        // Load document
        const docRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/documents/${documentId}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );

        if (!docRes.ok) {
          throw new Error('Document not found');
        }

        const doc = await docRes.json();
        setDocument(doc);
        setFormData({
          title: doc.title || '',
          description: doc.description || '',
          category_id: doc.category_id || '',
          access_level: doc.access_level || 'restricted',
          status: doc.status || 'published',
          requires_nda: doc.requires_nda || false,
        });

        // Load categories
        const catRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/document-categories`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
        const cats = await catRes.json();
        setCategories(cats);
      } catch (err: any) {
        setError(err.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [documentId, router]);

  const handleRemoveFile = () => {
    setFileRemoved(true);
    setNewFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFile(file);
    }
  };

  const handleCancelRemove = () => {
    setFileRemoved(false);
    setNewFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // If file was removed, a new file must be uploaded
    if (fileRemoved && !newFile) {
      setError('Please upload a new file to replace the removed file.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // If replacing file, use FormData with multipart upload
      if (newFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('file', newFile);
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('category_id', formData.category_id);
        formDataToSend.append('access_level', formData.access_level);
        formDataToSend.append('status', formData.status);
        formDataToSend.append('requires_nda', String(formData.requires_nda));

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/documents/${documentId}/replace`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formDataToSend,
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to replace document file');
        }
      } else {
        // Just update metadata without file
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/documents/${documentId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update document');
        }
      }

      setSuccess('Document updated successfully!');
      setTimeout(() => router.push('/admin/documents'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update document');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-900">Loading document...</div>;
  }

  if (!document) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        Document not found.{' '}
        <Link href="/admin/documents" className="underline">
          Go back to documents
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Document</h1>
        <Link
          href="/admin/documents"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Documents
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        {/* File Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Document File</h3>

          {!fileRemoved ? (
            // Show current file with remove button
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 font-medium">{document.file_name}</p>
                <p className="text-sm text-gray-500">
                  Size: {Math.round((document.file_size || 0) / 1024)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove File
              </button>
            </div>
          ) : (
            // Show upload interface when file is removed
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {newFile ? (
                  <div className="space-y-2">
                    <svg className="w-12 h-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-900 font-medium">{newFile.name}</p>
                    <p className="text-sm text-gray-500">
                      Size: {Math.round(newFile.size / 1024)} KB
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove selected file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-600">
                      <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                        Click to upload a new file
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.zip"
                        />
                      </label>
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, XLS, PPT, and other document formats
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCancelRemove}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                ← Cancel and keep original file
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category_id}
              onChange={(e) =>
                setFormData({ ...formData, category_id: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Level *
            </label>
            <select
              required
              value={formData.access_level}
              onChange={(e) =>
                setFormData({ ...formData, access_level: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public (anyone can download)</option>
              <option value="restricted">
                Restricted (requires approval)
              </option>
            </select>
          </div>

          {formData.access_level === 'restricted' && (
            <div className="flex items-center">
              <input
                id="requires_nda"
                type="checkbox"
                checked={formData.requires_nda}
                onChange={(e) => setFormData({ ...formData, requires_nda: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requires_nda" className="ml-2 block text-sm text-gray-900">
                Require NDA Acceptance
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving || (fileRemoved && !newFile)}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : newFile ? 'Replace File & Save' : 'Save Changes'}
            </button>
            <Link
              href="/admin/documents"
              className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
