import { apiRequest } from '@/lib/api';
import { SecurityUpdate } from '@/types';

async function getSecurityUpdates(): Promise<SecurityUpdate[]> {
  try {
    return await apiRequest<SecurityUpdate[]>('/api/security-updates');
  } catch {
    return [];
  }
}

function getSeverityColor(severity?: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default async function SecurityUpdatesPage() {
  const updates = await getSecurityUpdates();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Security Updates</h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Stay informed about the latest security advisories and updates.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {updates.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No security updates</h3>
            <p className="text-gray-600">No security updates at this time.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {updates.map((update) => (
              <article key={update.id} className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">{update.title}</h2>
                  {update.severity && (
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(update.severity)}`}>
                      {update.severity.toUpperCase()}
                    </span>
                  )}
                </div>
                {update.published_at && (
                  <p className="text-sm text-gray-500 mb-6">
                    Published: {update.published_at.split('T')[0]}
                  </p>
                )}
                <div
                  className="prose max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600"
                  dangerouslySetInnerHTML={{ __html: update.content }}
                />
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

