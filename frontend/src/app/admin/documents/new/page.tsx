'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { DocumentCategory } from '@/types';
import FormField from '@/components/ui/FormField';
import { useFormValidation } from '@/hooks/useFormValidation';

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
  const [fileError, setFileError] = useState('');
  const { errors: formErrors, validateAll, clearFieldError, clearErrors } = useFormValidation<typeof formData>({
    title: (value) => (value.trim() ? null : 'Title is required'),
    category_id: (value) => (value ? null : 'Category is required'),
  });

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
    if (!token) return;

    const isValid = validateAll(formData);
    if (!file) {
      setFileError('Please select a file to upload');
    }
    if (!isValid || !file) {
      setError('Please fix the highlighted form fields.');
      return;
    }

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
          <FormField
            label="File"
            htmlFor="file"
            required
            error={fileError}
            helpText="Accepted formats: PDF, DOCX, PNG, JPG (max 50MB)"
          >
            <input
              type="file"
              id="file"
              required
              accept=".pdf,.docx,.png,.jpg,.jpeg"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setFileError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </FormField>

          <FormField label="Title" htmlFor="title" required error={formErrors.title}>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                clearFieldError('title');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </FormField>

          <FormField label="Description" htmlFor="description">
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </FormField>

          <FormField label="Category" htmlFor="category_id" required error={formErrors.category_id}>
            <select
              id="category_id"
              required
              value={formData.category_id}
              onChange={(e) => {
                setFormData({ ...formData, category_id: e.target.value });
                clearFieldError('category_id');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}{cat.is_hidden ? ' (Hidden)' : ''}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Access Level"
            htmlFor="access_level"
            required
            helpText="Note: All restricted documents require NDA acceptance before download."
          >
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
          </FormField>

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
              onClick={() => clearErrors()}
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
