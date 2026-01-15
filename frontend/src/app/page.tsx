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

async function getControlCategories() {
  try {
    return await apiRequest<any[]>('/api/control-categories');
  } catch {
    return [];
  }
}

async function getSecurityUpdates() {
  try {
    return await apiRequest<any[]>('/api/security-updates');
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
  const [settings, documents, categories, certifications, controlCategories, securityUpdates] = await Promise.all([
    getSettings(),
    getDocuments(),
    getCategories(),
    getCertifications(),
    getControlCategories(),
    getSecurityUpdates(),
  ]);

  const publishedDocs = documents.filter(doc => doc.status === 'published');

  // Severity color helper for security updates
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Clean, Professional Design */}
      <section
        className="text-white"
        style={{ backgroundColor: settings.primary_color || '#111827' }}
      >
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
                className="inline-flex items-center px-6 py-3 bg-white rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                style={{ color: settings.primary_color || '#111827' }}
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
                    href={doc.access_level === 'public'
                      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/documents/${doc.id}/download`
                      : `/documents/${doc.id}/request`}
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

      {/* Security Controls Section */}
      {controlCategories.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Controls</h2>
                <p className="text-gray-600">Our comprehensive security framework</p>
              </div>
              <Link
                href="/controls"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                See All Controls
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {controlCategories.slice(0, 6).map((category: any) => (
                <Link
                  key={category.id}
                  href="/controls"
                  className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                  {category.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Security Updates Section */}
      {securityUpdates.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Updates</h2>
                <p className="text-gray-600">Latest security advisories and announcements</p>
              </div>
              <Link
                href="/security-updates"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                See All Security Updates
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {securityUpdates.slice(0, 3).map((update: any) => (
                <Link
                  key={update.id}
                  href="/security-updates"
                  className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    {update.severity && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(update.severity)}`}>
                        {update.severity.charAt(0).toUpperCase() + update.severity.slice(1)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {update.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {update.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>
                  <div className="text-xs text-gray-500">
                    {update.published_at ? update.published_at.split('T')[0] : ''}
                  </div>
                </Link>
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

