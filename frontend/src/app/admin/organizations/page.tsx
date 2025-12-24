'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { Organization } from '@/types';

export default function OrganizationsAdminPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrganizations() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setToken(session.access_token);
        try {
          const data = await apiRequestWithAuth<Organization[]>('/api/organizations', session.access_token);
          setOrganizations(data);
        } catch (error) {
          console.error('Failed to load organizations:', error);
        }
      }
      setLoading(false);
    }
    loadOrganizations();
  }, []);

  if (loading) {
    return <div className="text-gray-900">Loading...</div>;
  }

  return (
    <>
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Organizations</h1>

      {organizations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No organizations found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div key={org.id} className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 truncate" title={org.name}>{org.name}</h3>
              <p className="text-gray-700 mb-2 break-words">
                <span className="text-gray-600">Domain:</span>{' '}
                <span className="font-medium text-gray-900">{org.email_domain}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Approved Documents: <span className="font-semibold text-gray-900">{org.approved_document_ids?.length || 0}</span>
              </p>
              {org.first_approved_at && (
                <p className="text-xs text-gray-500">
                  First approved: {new Date(org.first_approved_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

