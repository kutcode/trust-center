'use client';

import { Suspense, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { Organization } from '@/types';
import OrganizationEditModal from '@/components/admin/OrganizationEditModal';
import { useQueryParam } from '@/hooks/useQueryParam';
import ConfirmModal from '@/components/ui/ConfirmModal';

type StatusFilter = 'all' | 'whitelisted' | 'conditional' | 'no_access' | 'archived';

function OrganizationsAdminPageContent() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [archivedOrganizations, setArchivedOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [statusFilterParam, setStatusFilterParam] = useQueryParam('status');
  const statusFilter: StatusFilter =
    statusFilterParam === 'whitelisted' ||
    statusFilterParam === 'conditional' ||
    statusFilterParam === 'no_access' ||
    statusFilterParam === 'archived'
      ? statusFilterParam
      : 'all';
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [removingOrg, setRemovingOrg] = useState<Organization | null>(null);
  const [processingOrg, setProcessingOrg] = useState<string | null>(null);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState<null | 'archive' | 'restore' | 'permanent_delete'>(null);
  const [bulkConfirm, setBulkConfirm] = useState<null | 'archive' | 'restore' | 'permanent_delete'>(null);
  const [permanentDeleteOrg, setPermanentDeleteOrg] = useState<Organization | null>(null);

  const reloadOrganizations = async (authToken: string) => {
    const data = await apiRequestWithAuth<Organization[]>('/api/organizations', authToken);
    setOrganizations(data.filter(org => org.is_active !== false));
    setArchivedOrganizations(data.filter(org => org.is_active === false));
  };

  useEffect(() => {
    async function loadOrganizations() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setToken(session.access_token);
        try {
          // Load active organizations
          await reloadOrganizations(session.access_token);
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
    } else if (statusFilter === 'archived') {
      setFilteredOrganizations(archivedOrganizations);
    } else {
      setFilteredOrganizations(organizations.filter(org => org.status === statusFilter));
    }
  }, [organizations, archivedOrganizations, statusFilter]);

  useEffect(() => {
    setSelectedOrgIds((prev) => prev.filter((id) => filteredOrganizations.some((org) => org.id === id)));
  }, [filteredOrganizations]);

  const handleRemove = async (org: Organization) => {
    if (!token) return;

    setProcessingOrg(org.id);
    try {
      await apiRequestWithAuth(`/api/admin/organizations/${org.id}`, token, {
        method: 'DELETE',
      });
      await reloadOrganizations(token);
      setSelectedOrgIds((prev) => prev.filter((id) => id !== org.id));
      setRemovingOrg(null);
    } catch (error: any) {
      alert(`Failed to remove organization: ${error.message}`);
    } finally {
      setProcessingOrg(null);
    }
  };

  const handleRestore = async (org: Organization) => {
    if (!token) return;

    setProcessingOrg(org.id);
    try {
      await apiRequestWithAuth(`/api/admin/organizations/${org.id}/restore`, token, {
        method: 'PATCH',
      });
      await reloadOrganizations(token);
      setSelectedOrgIds((prev) => prev.filter((id) => id !== org.id));
    } catch (error: any) {
      alert(`Failed to restore organization: ${error.message}`);
    } finally {
      setProcessingOrg(null);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    await reloadOrganizations(token);
  };

  const handlePermanentDelete = async (org: Organization) => {
    if (!token) return;
    setProcessingOrg(org.id);
    try {
      await apiRequestWithAuth(`/api/admin/organizations/${org.id}/permanent`, token, {
        method: 'DELETE',
      });
      await reloadOrganizations(token);
      setSelectedOrgIds((prev) => prev.filter((id) => id !== org.id));
      if (editingOrg?.id === org.id) setEditingOrg(null);
      setPermanentDeleteOrg(null);
    } catch (error: any) {
      alert(`Failed to permanently delete organization: ${error.message}`);
    } finally {
      setProcessingOrg(null);
    }
  };

  const visibleSelectedCount = selectedOrgIds.length;
  const allVisibleSelected = filteredOrganizations.length > 0 && filteredOrganizations.every((org) => selectedOrgIds.includes(org.id));

  const toggleOrgSelection = (orgId: string) => {
    setSelectedOrgIds((prev) => (
      prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]
    ));
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedOrgIds((prev) => prev.filter((id) => !filteredOrganizations.some((org) => org.id === id)));
    } else {
      const visibleIds = filteredOrganizations.map((org) => org.id);
      setSelectedOrgIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const runBulkAction = async (action: 'archive' | 'restore' | 'permanent_delete') => {
    if (!token || selectedOrgIds.length === 0) return;
    setBulkActionLoading(action);
    try {
      await apiRequestWithAuth('/api/admin/organizations/bulk', token, {
        method: 'POST',
        body: JSON.stringify({
          ids: selectedOrgIds,
          action,
        }),
      });
      await reloadOrganizations(token);
      setSelectedOrgIds([]);
      setBulkConfirm(null);
    } catch (error: any) {
      alert(`Failed to run bulk action: ${error.message}`);
    } finally {
      setBulkActionLoading(null);
    }
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
      case 'archived':
        return 'Archived';
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
          {(['all', 'whitelisted', 'conditional', 'no_access', 'archived'] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilterParam(filter === 'all' ? null : filter)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${statusFilter === filter
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {filter === 'all' ? 'All Active' : getStatusLabel(filter)}
              <span className="ml-2 text-xs">
                ({filter === 'all'
                  ? organizations.length
                  : filter === 'archived'
                    ? archivedOrganizations.length
                    : organizations.filter(org => org.status === filter).length})
              </span>
            </button>
          ))}
        </nav>
      </div>

      {filteredOrganizations.length > 0 && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                className="rounded border-gray-300 text-blue-600"
              />
              <span>Select all visible</span>
            </label>
            <span className="text-sm text-gray-500">
              {visibleSelectedCount} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilter === 'archived' ? (
              <>
                <button
                  onClick={() => setBulkConfirm('restore')}
                  disabled={visibleSelectedCount === 0 || bulkActionLoading !== null}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  Restore Selected
                </button>
                <button
                  onClick={() => setBulkConfirm('permanent_delete')}
                  disabled={visibleSelectedCount === 0 || bulkActionLoading !== null}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                >
                  Permanently Delete Selected
                </button>
              </>
            ) : (
              <button
                onClick={() => setBulkConfirm('archive')}
                disabled={visibleSelectedCount === 0 || bulkActionLoading !== null}
                className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                Archive Selected
              </button>
            )}
          </div>
        </div>
      )}

      {filteredOrganizations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">
            {statusFilter === 'all'
              ? 'No active organizations found.'
              : statusFilter === 'archived'
                ? 'No archived organizations.'
                : `No ${getStatusLabel(statusFilter).toLowerCase()} organizations found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <div
              key={org.id}
              className={`bg-white rounded-lg shadow border ${statusFilter === 'archived' ? 'border-gray-300 opacity-75' : 'border-gray-200'} hover:shadow-md transition-shadow`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedOrgIds.includes(org.id)}
                      onChange={() => toggleOrgSelection(org.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600"
                      aria-label={`Select ${org.name}`}
                    />
                    <h3 className="text-xl font-semibold text-gray-900 truncate flex-1" title={org.name}>
                      {org.name}
                    </h3>
                  </div>
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
                  <p className="text-xs text-gray-500 mb-4">
                    Initial Approval: {new Date(org.first_approved_at).toLocaleDateString()}
                  </p>
                )}

                {statusFilter === 'archived' && org.revoked_at && (
                  <p className="text-xs text-gray-500 mb-4">
                    Archived: {new Date(org.revoked_at).toLocaleDateString()}
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
                  {statusFilter === 'archived' ? (
                    <button
                      onClick={() => handleRestore(org)}
                      disabled={processingOrg === org.id}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {processingOrg === org.id ? 'Restoring...' : 'Restore'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setRemovingOrg(org)}
                      disabled={processingOrg === org.id}
                      className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                      {processingOrg === org.id ? 'Removing...' : 'Remove'}
                    </button>
                  )}
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

      {/* Remove Confirmation Modal */}
      {removingOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Remove Organization?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove <strong>{removingOrg.name}</strong> from the active list?
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">This will:</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Move the organization to the Archived section</li>
                <li>Keep their status as Conditional for your review</li>
                <li>Preserve all audit trail and history</li>
                <li>You can later set No Access or restore from the Archived tab</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRemovingOrg(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemove(removingOrg)}
                disabled={processingOrg === removingOrg.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {processingOrg === removingOrg.id ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingOrg && token && (
        <OrganizationEditModal
          organization={editingOrg}
          isOpen={!!editingOrg}
          onClose={() => setEditingOrg(null)}
          onSave={handleSave}
          token={token}
          onPermanentDelete={editingOrg.is_active === false ? (org) => setPermanentDeleteOrg(org) : undefined}
          permanentDeleteLoading={processingOrg === editingOrg.id}
        />
      )}

      <ConfirmModal
        isOpen={!!permanentDeleteOrg}
        onClose={() => {
          if (!processingOrg) setPermanentDeleteOrg(null);
        }}
        onConfirm={() => {
          if (permanentDeleteOrg) handlePermanentDelete(permanentDeleteOrg);
        }}
        title="Permanently Delete Organization?"
        message={permanentDeleteOrg
          ? `This will permanently delete ${permanentDeleteOrg.name} and cannot be undone. Archived history tied to this organization may also be removed by database cascades.`
          : ''}
        confirmLabel="Delete Permanently"
        confirmStyle="danger"
        isLoading={!!permanentDeleteOrg && processingOrg === permanentDeleteOrg.id}
      />

      <ConfirmModal
        isOpen={!!bulkConfirm}
        onClose={() => {
          if (!bulkActionLoading) setBulkConfirm(null);
        }}
        onConfirm={() => {
          if (bulkConfirm) runBulkAction(bulkConfirm);
        }}
        title={
          bulkConfirm === 'archive'
            ? 'Archive Selected Organizations?'
            : bulkConfirm === 'restore'
              ? 'Restore Selected Organizations?'
              : 'Permanently Delete Selected Organizations?'
        }
        message={
          bulkConfirm === 'archive'
            ? `Archive ${visibleSelectedCount} selected organization(s)? They will move to the Archived tab.`
            : bulkConfirm === 'restore'
              ? `Restore ${visibleSelectedCount} selected archived organization(s)? They will return as Conditional.`
              : `Permanently delete ${visibleSelectedCount} selected archived organization(s)? This cannot be undone.`
        }
        confirmLabel={
          bulkConfirm === 'archive'
            ? 'Archive Selected'
            : bulkConfirm === 'restore'
              ? 'Restore Selected'
              : 'Delete Permanently'
        }
        confirmStyle={bulkConfirm === 'restore' ? 'primary' : 'danger'}
        isLoading={bulkActionLoading !== null}
      />
    </>
  );
}

function OrganizationsAdminPageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-900">Loading organizations...</div>
    </div>
  );
}

export default function OrganizationsAdminPage() {
  return (
    <Suspense fallback={<OrganizationsAdminPageFallback />}>
      <OrganizationsAdminPageContent />
    </Suspense>
  );
}
