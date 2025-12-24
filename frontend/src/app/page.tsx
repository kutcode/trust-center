import { apiRequest } from '@/lib/api';
import { TrustCenterSettings, Document } from '@/types';
import Link from 'next/link';

async function getSettings(): Promise<TrustCenterSettings> {
  try {
    return await apiRequest<TrustCenterSettings>('/api/settings');
  } catch {
    return {
      id: 'default',
      primary_color: '#007bff',
      secondary_color: '#6c757d',
      hero_title: 'Security & Compliance',
      hero_subtitle: 'Your trusted partner for security and compliance documentation',
    };
  }
}

async function getDocuments(): Promise<Document[]> {
  try {
    return await apiRequest<Document[]>('/api/documents?access_level=public');
  } catch {
    return [];
  }
}

export default async function Home() {
  const settings = await getSettings();
  const documents = await getDocuments();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20"
        style={{
          background: settings.hero_image_url 
            ? `url(${settings.hero_image_url}) center/cover`
            : undefined,
        }}
      >
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">
            {settings.hero_title || 'Security & Compliance'}
          </h1>
          <p className="text-xl mb-8">
            {settings.hero_subtitle || 'Your trusted partner for security and compliance documentation'}
          </p>
          <Link
            href="/documents"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Browse Documents
          </Link>
        </div>
      </section>

      {/* About Section */}
      {settings.about_section && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: settings.about_section }}
            />
          </div>
        </section>
      )}

      {/* Public Documents Preview */}
      {documents.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Public Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.slice(0, 6).map((doc) => (
                <div key={doc.id} className="border rounded-lg p-6 hover:shadow-lg transition">
                  <h3 className="text-xl font-semibold mb-2">{doc.title}</h3>
                  {doc.description && (
                    <p className="text-gray-600 mb-4">{doc.description}</p>
                  )}
                  <Link
                    href={`/documents/${doc.id}/download`}
                    className="text-blue-600 hover:underline"
                  >
                    Download →
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/documents"
                className="text-blue-600 hover:underline font-semibold"
              >
                View All Documents →
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
