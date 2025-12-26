import { apiRequest } from '@/lib/api';
import { Certification } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

async function getCertifications(): Promise<Certification[]> {
  try {
    return await apiRequest<Certification[]>('/api/certifications');
  } catch {
    return [];
  }
}

// Pre-built badge icons for common certifications
const certificationBadges: { [key: string]: { icon: string; color: string; bgColor: string } } = {
  'soc2': { icon: '🛡️', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'soc 2': { icon: '🛡️', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'iso 27001': { icon: '🏆', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  'iso27001': { icon: '🏆', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  'hipaa': { icon: '🏥', color: 'text-green-700', bgColor: 'bg-green-100' },
  'gdpr': { icon: '🇪🇺', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  'pci': { icon: '💳', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  'pci-dss': { icon: '💳', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  'fedramp': { icon: '🏛️', color: 'text-red-700', bgColor: 'bg-red-100' },
  'ccpa': { icon: '🌴', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  'default': { icon: '✓', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

function getBadge(name: string) {
  const lowerName = name.toLowerCase();
  for (const [key, badge] of Object.entries(certificationBadges)) {
    if (lowerName.includes(key)) return badge;
  }
  return certificationBadges.default;
}

function getValidityStatus(expiryDate: string | null) {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return { label: 'Expired', class: 'bg-red-100 text-red-700 border-red-200' };
  } else if (daysUntilExpiry <= 30) {
    return { label: 'Expiring Soon', class: 'bg-amber-100 text-amber-700 border-amber-200' };
  } else {
    return { label: 'Valid', class: 'bg-green-100 text-green-700 border-green-200' };
  }
}

export default async function CertificationsPage() {
  const certifications = await getCertifications();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">Certifications</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Compliance Certifications</h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Our security and compliance certifications demonstrate our commitment to protecting your data.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {certifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No certifications</h3>
            <p className="text-gray-600">No certifications available at this time.</p>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{certifications.length}</div>
                  <div className="text-sm text-gray-600">Total Certifications</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {certifications.filter(c => {
                      if (!c.expiry_date) return true;
                      return new Date(c.expiry_date) > new Date();
                    }).length}
                  </div>
                  <div className="text-sm text-gray-600">Currently Valid</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {new Set(certifications.map(c => c.issuer)).size}
                  </div>
                  <div className="text-sm text-gray-600">Issuing Bodies</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">24/7</div>
                  <div className="text-sm text-gray-600">Continuous Monitoring</div>
                </div>
              </div>
            </div>

            {/* Certifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certifications.map((cert) => {
                const badge = getBadge(cert.name);
                const validity = getValidityStatus(cert.expiry_date);

                return (
                  <div
                    key={cert.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                  >
                    {/* Badge Header */}
                    <div className={`${badge.bgColor} p-6 flex items-center justify-center`}>
                      {cert.certificate_image_url ? (
                        <Image
                          src={cert.certificate_image_url}
                          alt={cert.name}
                          width={120}
                          height={120}
                          className="w-auto h-24 object-contain"
                        />
                      ) : (
                        <div className="text-6xl">{badge.icon}</div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{cert.name}</h3>
                        {validity && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${validity.class}`}>
                            {validity.label}
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-4">
                        Issued by: <span className="font-medium">{cert.issuer}</span>
                      </p>

                      <div className="flex flex-col gap-1 text-sm text-gray-500 mb-4">
                        {cert.issue_date && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {cert.expiry_date && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Expires: {new Date(cert.expiry_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {cert.description && (
                        <p className="text-gray-700 text-sm border-t border-gray-100 pt-4">
                          {cert.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust Statement */}
            <div className="mt-12 bg-gray-900 rounded-xl p-8 text-center text-white">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold mb-3">Committed to Security</h3>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Our certifications are regularly audited and renewed to ensure we maintain the highest standards
                of security and compliance. If you have questions about our security practices, please contact us.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center mt-6 px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact Security Team
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
