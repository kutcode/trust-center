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
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Compliance Certifications</h1>
      
      {certifications.length === 0 ? (
        <p className="text-gray-600">No certifications available at this time.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certifications.map((cert) => (
            <div key={cert.id} className="border rounded-lg p-6 hover:shadow-lg transition">
              {cert.certificate_image_url && (
                <div className="mb-4">
                  <Image
                    src={cert.certificate_image_url}
                    alt={cert.name}
                    width={200}
                    height={200}
                    className="w-full h-auto"
                  />
                </div>
              )}
              <h3 className="text-xl font-semibold mb-2">{cert.name}</h3>
              <p className="text-gray-600 mb-2">Issued by: {cert.issuer}</p>
              {cert.issue_date && (
                <p className="text-sm text-gray-500">
                  Issued: {new Date(cert.issue_date).toLocaleDateString()}
                </p>
              )}
              {cert.expiry_date && (
                <p className="text-sm text-gray-500">
                  Expires: {new Date(cert.expiry_date).toLocaleDateString()}
                </p>
              )}
              {cert.description && (
                <p className="mt-4 text-gray-700">{cert.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

