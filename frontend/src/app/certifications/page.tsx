import { apiRequest } from '@/lib/api';
import { Certification } from '@/types';
import Image from 'next/image';

async function getCertifications(): Promise<Certification[]> {
  try {
    return await apiRequest<Certification[]>('/api/certifications');
  } catch {
    return [];
  }
}

export default async function CertificationsPage() {
  const certifications = await getCertifications();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Compliance Certifications</h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            View our security and compliance certifications and accreditations.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {certifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No certifications</h3>
            <p className="text-gray-600">No certifications available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert) => (
              <div key={cert.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                {cert.certificate_image_url && (
                  <div className="mb-4 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                    <Image
                      src={cert.certificate_image_url}
                      alt={cert.name}
                      width={200}
                      height={200}
                      className="w-full h-auto max-h-48 object-contain"
                    />
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{cert.name}</h3>
                <p className="text-gray-600 mb-2 text-sm">Issued by: <span className="font-medium">{cert.issuer}</span></p>
                {cert.issue_date && (
                  <p className="text-sm text-gray-500 mb-1">
                    Issued: {new Date(cert.issue_date).toLocaleDateString()}
                  </p>
                )}
                {cert.expiry_date && (
                  <p className="text-sm text-gray-500 mb-4">
                    Expires: {new Date(cert.expiry_date).toLocaleDateString()}
                  </p>
                )}
                {cert.description && (
                  <p className="mt-4 text-gray-700 text-sm">{cert.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

