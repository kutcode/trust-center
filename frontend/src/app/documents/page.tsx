import { apiRequest } from '@/lib/api';
import { Document, DocumentCategory } from '@/types';
import Link from 'next/link';

async function getDocuments(): Promise<Document[]> {
  try {
    return await apiRequest<Document[]>('/api/documents');
  } catch {
    return [];
  }
}

async function getCategories(): Promise<DocumentCategory[]> {
  try {
    return await apiRequest<DocumentCategory[]>('/api/document-categories');
  } catch {
    return [];
  }
}

export default async function DocumentsPage() {
  const documents = await getDocuments();
  const categories = await getCategories();

  const publicDocs = documents.filter(doc => doc.access_level === 'public');
  const restrictedDocs = documents.filter(doc => doc.access_level === 'restricted');

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Documents</h1>

      {/* Public Documents */}
      {publicDocs.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Public Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicDocs.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-6 hover:shadow-lg transition">
                <h3 className="text-xl font-semibold mb-2">{doc.title}</h3>
                {doc.description && (
                  <p className="text-gray-600 mb-4">{doc.description}</p>
                )}
                {doc.document_categories && (
                  <p className="text-sm text-gray-500 mb-4">
                    Category: {doc.document_categories.name}
                  </p>
                )}
                <Link
                  href={`/documents/${doc.id}/download`}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Download →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Restricted Documents */}
      {restrictedDocs.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-6">Restricted Documents</h2>
          <p className="text-gray-600 mb-6">
            These documents require approval. Click "Request Access" to submit a request.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restrictedDocs.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-6 hover:shadow-lg transition">
                <h3 className="text-xl font-semibold mb-2">{doc.title}</h3>
                {doc.description && (
                  <p className="text-gray-600 mb-4">{doc.description}</p>
                )}
                {doc.document_categories && (
                  <p className="text-sm text-gray-500 mb-4">
                    Category: {doc.document_categories.name}
                  </p>
                )}
                <Link
                  href={`/documents/${doc.id}/request`}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Request Access →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {documents.length === 0 && (
        <p className="text-gray-600">No documents available at this time.</p>
      )}
    </div>
  );
}

