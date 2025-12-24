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
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Security Updates</h1>
      
      {updates.length === 0 ? (
        <p className="text-gray-600">No security updates at this time.</p>
      ) : (
        <div className="space-y-6">
          {updates.map((update) => (
            <article key={update.id} className="border rounded-lg p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-semibold">{update.title}</h2>
                {update.severity && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(update.severity)}`}>
                    {update.severity.toUpperCase()}
                  </span>
                )}
              </div>
              {update.published_at && (
                <p className="text-sm text-gray-500 mb-4">
                  Published: {new Date(update.published_at).toLocaleDateString()}
                </p>
              )}
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: update.content }}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

