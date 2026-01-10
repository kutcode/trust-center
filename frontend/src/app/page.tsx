import { apiRequest } from '@/lib/api';
import { TrustCenterSettings, Document, DocumentCategory } from '@/types';
import Link from 'next/link';

async function getSettings(): Promise<TrustCenterSettings> {
  try {
    return await apiRequest<TrustCenterSettings>('/api/settings');
  } catch {
    return {
      id: 'default',
      primary_color: '#111827',
      secondary_color: '#3b82f6',
      hero_title: 'Security & Trust',
      hero_subtitle: 'Learn about our commitment to keeping your data safe and secure',
    };
  }
}

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

async function getCertifications() {
  try {
    return await apiRequest<any[]>('/api/certifications');
  } catch {
    return [];
  }
}

// Category icons mapping
const categoryIcons: { [key: string]: string } = {
  'compliance': '📋',
  'security': '🔒',
  'privacy': '🛡️',
  'legal': '📜',
  'soc': '✅',
  'iso': '🏆',
  'gdpr': '🇪🇺',
  'hipaa': '🏥',
  'default': '📄',
};

function getCategoryIcon(categoryName: string): string {
  const lowerName = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerName.includes(key)) return icon;
  }
  return categoryIcons.default;
}

export default async function Home() {
  const [settings, documents, categories, certifications] = await Promise.all([
    getSettings(),
    getDocuments(),
    getCategories(),
    getCertifications(),
  ]);

  const publishedDocs = documents.filter(doc => doc.status === 'published');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Clean, Professional Design */}
      <section className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              {settings.hero_title || 'Security & Trust'}
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              {settings.hero_subtitle || 'Learn about our commitment to keeping your data safe and secure'}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/documents"
                className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse Documents
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/certifications"
                className="inline-flex items-center px-6 py-3 border border-gray-500 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                View Certifications
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Stats Section */}
      <section className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">{certifications.length}</div>
              <div className="text-gray-600">Certifications</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">{publishedDocs.length}</div>
              <div className="text-gray-600">Documents</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-gray-600">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Document Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Security Resources</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Access our comprehensive library of security and compliance documentation
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.slice(0, 6).map((category) => {
                const docCount = publishedDocs.filter(doc => doc.category_id === category.id).length;
                return (
                  <Link
                    key={category.id}
                    href={`/documents?category=${category.id}`}
                    className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">
                        {getCategoryIcon(category.name)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                        <div className="text-sm text-gray-500">
                          {docCount} document{docCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
            {categories.length > 6 && (
              <div className="mt-8 text-center">
                <Link
                  href="/documents"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View All Categories
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recent Documents Section */}
      {publishedDocs.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Recent Documents</h2>
                <p className="text-gray-600">Latest additions to our documentation library</p>
              </div>
              <Link
                href="/documents"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedDocs.slice(0, 6).map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">
                      {doc.file_type?.includes('pdf') ? '📄' : '📎'}
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${doc.access_level === 'public'
                      ? 'text-green-700 bg-green-50'
                      : 'text-amber-700 bg-amber-50'
                      }`}>
                      {doc.access_level === 'public' ? 'Public' : 'Restricted'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
                  {doc.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{doc.description}</p>
                  )}
                  <Link
                    href={doc.access_level === 'public' ? `/documents/${doc.id}/download` : `/documents/${doc.id}/request`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm group"
                  >
                    {doc.access_level === 'public' ? 'Download' : 'Request Access'}
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {settings.about_section && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div
              className="prose prose-lg max-w-3xl mx-auto text-gray-700"
              dangerouslySetInnerHTML={{ __html: settings.about_section }}
            />
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to learn more?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            If you have questions about our security practices or need access to specific documentation, our team is here to help.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Contact Us
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

