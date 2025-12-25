'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { Organization } from '@/types';
import OrganizationEditModal from '@/components/admin/OrganizationEditModal';

type StatusFilter = 'all' | 'whitelisted' | 'conditional' | 'no_access';

export default function OrganizationsAdminPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<string | null>(null);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

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

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrganizations(organizations);
    } else {
      setFilteredOrganizations(organizations.filter(org => org.status === statusFilter));
    }
  }, [organizations, statusFilter]);

  const handleDelete = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to revoke access for "${orgName}"?\n\nThis will:\n- Block all future document requests from this organization\n- Preserve audit trail of past approvals\n- Can be restored by editing the organization`)) {
      return;
    }

    if (!token) return;

    setDeletingOrg(orgId);
    try {
      await apiRequestWithAuth(`/api/admin/organizations/${orgId}`, token, {
        method: 'DELETE',
      });
      // Reload organizations
      const data = await apiRequestWithAuth<Organization[]>('/api/organizations', token);
      setOrganizations(data);
      setDeletingOrg(null);
    } catch (error: any) {
      alert(`Failed to revoke organization: ${error.message}`);
      setDeletingOrg(null);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    const data = await apiRequestWithAuth<Organization[]>('/api/organizations', token);
    setOrganizations(data);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-semibold';
    switch (status) {
      case 'whitelisted':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'conditional':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'no_access':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'whitelisted':
        return 'Whitelisted';
      case 'conditional':
        return 'Conditional';
      case 'no_access':
        return 'No Access';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-900">Loading organizations...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Organizations</h1>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {(['all', 'whitelisted', 'conditional', 'no_access'] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                statusFilter === filter
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {filter === 'all' ? 'All' : getStatusLabel(filter)}
              {filter !== 'all' && (
                <span className="ml-2 text-xs">
                  ({organizations.filter(org => org.status === filter).length})
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {filteredOrganizations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">
            {statusFilter === 'all' 
              ? 'No organizations found.' 
              : `No ${getStatusLabel(statusFilter).toLowerCase()} organizations found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <div 
              key={org.id} 
              className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 truncate flex-1" title={org.name}>
                    {org.name}
                  </h3>
                  <span className={getStatusBadge(org.status)}>
                    {getStatusLabel(org.status)}
                  </span>
                </div>

                <p className="text-gray-700 mb-2 break-words">
                  <span className="text-gray-600">Domain:</span>{' '}
                  <span className="font-medium text-gray-900">{org.email_domain}</span>
                </p>

                <p className="text-sm text-gray-600 mb-4">
                  Approved Documents: <span className="font-semibold text-gray-900">{org.approved_document_ids?.length || 0}</span>
                </p>

                {org.first_approved_at && (
                  <p className="text-xs text-gray-500 mb-2">
                    First approved: {new Date(org.first_approved_at).toLocaleDateString()}
                  </p>
                )}

                {org.last_approved_at && (
                  <p className="text-xs text-gray-500 mb-4">
                    Last approved: {new Date(org.last_approved_at).toLocaleDateString()}
                  </p>
                )}

                {org.revoked_at && (
                  <p className="text-xs text-red-600 mb-4">
                    Revoked: {new Date(org.revoked_at).toLocaleDateString()}
                  </p>
                )}

                {org.notes && expandedOrg === org.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                    <strong>Notes:</strong> {org.notes}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setEditingOrg(org)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(org.id, org.name)}
                    disabled={deletingOrg === org.id}
                    className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                  >
                    {deletingOrg === org.id ? 'Revoking...' : 'Revoke'}
                  </button>
                </div>

                {org.notes && (
                  <button
                    onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    {expandedOrg === org.id ? 'Hide notes' : 'Show notes'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingOrg && token && (
        <OrganizationEditModal
          organization={editingOrg}
          isOpen={!!editingOrg}
          onClose={() => setEditingOrg(null)}
          onSave={handleSave}
          token={token}
        />
      )}
    </>
  );
}
