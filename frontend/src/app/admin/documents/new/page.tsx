'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { DocumentCategory } from '@/types';

export default function UploadDocumentPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    access_level: 'restricted' as 'public' | 'restricted',
    requires_nda: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setToken(session.access_token);
        try {
          const cats = await apiRequestWithAuth<DocumentCategory[]>('/api/document-categories?include_hidden=true', session.access_token);
          setCategories(cats);
        } catch (error) {
          console.error('Failed to load categories:', error);
        }
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category_id', formData.category_id);
      formDataToSend.append('access_level', formData.access_level);
      formDataToSend.append('requires_nda', String(formData.requires_nda));

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      console.log('Uploading to:', `${apiUrl}/api/documents`);
      console.log('File:', file.name, file.size, 'bytes');

      const response = await fetch(`${apiUrl}/api/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formDataToSend,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || 'Upload failed';
          console.error('Upload error:', error);
        } catch (e) {
          errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Upload successful:', result);

      router.push('/admin/documents');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload document. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8 gap-4">
        <h1 className="text-4xl font-bold text-gray-900">Upload New Document</h1>
        <button
          type="button"
          onClick={() => router.push('/admin/documents')}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Documents
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-2 text-gray-700">
              File *
            </label>
            <input
              type="file"
              id="file"
              required
              accept=".pdf,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
            <p className="text-sm text-gray-600 mt-1">Accepted formats: PDF, DOCX, PNG, JPG (max 50MB)</p>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-700">
              Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="category_id" className="block text-sm font-medium mb-2 text-gray-700">
              Category *
            </label>
            <select
              id="category_id"
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}{cat.is_hidden ? ' (Hidden)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="access_level" className="block text-sm font-medium mb-2 text-gray-700">
              Access Level *
            </label>
            <select
              id="access_level"
              required
              value={formData.access_level}
              onChange={(e) => setFormData({ ...formData, access_level: e.target.value as 'public' | 'restricted' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            >
              <option value="public">Public (anyone can download)</option>
              <option value="restricted">Restricted (requires approval)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Note: All restricted documents require NDA acceptance before download.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !file}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Uploading...' : 'Upload Document'}
            </button>
            <Link
              href="/admin/documents"
              className="bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
