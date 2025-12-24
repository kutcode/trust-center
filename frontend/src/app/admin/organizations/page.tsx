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
    return <div className="container mx-auto px-4 py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Organizations</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <div key={org.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-2">{org.name}</h3>
            <p className="text-gray-600 mb-2">Domain: {org.email_domain}</p>
            <p className="text-sm text-gray-500 mb-4">
              Approved Documents: {org.approved_document_ids?.length || 0}
            </p>
            {org.first_approved_at && (
              <p className="text-xs text-gray-400">
                First approved: {new Date(org.first_approved_at).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

