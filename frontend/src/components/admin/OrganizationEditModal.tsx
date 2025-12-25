'use client';

import { useState, useEffect } from 'react';
import { Organization } from '@/types';
import { apiRequestWithAuth } from '@/lib/api';

interface OrganizationEditModalProps {
  organization: Organization | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  token: string;
}

export default function OrganizationEditModal({
  organization,
  isOpen,
  onClose,
  onSave,
  token,
}: OrganizationEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email_domain: '',
    notes: '',
    status: 'conditional' as 'whitelisted' | 'conditional' | 'no_access',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusChangeConfirm, setStatusChangeConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        email_domain: organization.email_domain || '',
        notes: organization.notes || '',
        status: organization.status || 'conditional',
      });
      setError(null);
    }
  }, [organization]);

  if (!isOpen || !organization) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate email domain format
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!domainRegex.test(formData.email_domain)) {
        throw new Error('Invalid email domain format');
      }

      // Check if status is changing
      const statusChanged = formData.status !== organization.status;
      
      if (statusChanged && !statusChangeConfirm) {
        // Show confirmation dialog
        setStatusChangeConfirm(formData.status);
        setLoading(false);
        return;
      }

      // Update organization
      const updatePayload: any = {
        name: formData.name,
        email_domain: formData.email_domain,
        notes: formData.notes || null,
      };

      // If status changed, use the status endpoint
      if (statusChanged) {
        await apiRequestWithAuth(
          `/api/admin/organizations/${organization.id}/status`,
          token,
          {
            method: 'PATCH',
            body: JSON.stringify({ status: formData.status }),
          }
        );
      }

      // Update other fields
      await apiRequestWithAuth(
        `/api/organizations/${organization.id}`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify(updatePayload),
        }
      );

      onSave();
      onClose();
      setStatusChangeConfirm(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: 'whitelisted' | 'conditional' | 'no_access') => {
    setFormData({ ...formData, status: newStatus });
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'whitelisted':
        return 'All documents will be auto-approved for users from this organization';
      case 'conditional':
        return 'Documents approved on a case-by-case basis';
      case 'no_access':
        return 'All requests from this organization will be blocked';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Organization</h2>
        </div>

        {statusChangeConfirm && (
          <div className="p-6 bg-yellow-50 border-b border-yellow-200">
            <p className="text-yellow-800 font-semibold mb-2">Confirm Status Change</p>
            <p className="text-yellow-700 mb-4">
              Changing status to <strong>{statusChangeConfirm}</strong> will affect future document requests.
            </p>
            <p className="text-yellow-700 mb-4">{getStatusDescription(statusChangeConfirm)}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStatusChangeConfirm(null);
                  setFormData({ ...formData, status: organization.status });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setStatusChangeConfirm(null);
                  handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Confirm Change
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Domain
              </label>
              <input
                type="text"
                value={formData.email_domain}
                onChange={(e) => setFormData({ ...formData, email_domain: e.target.value })}
                required
                placeholder="example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">Users with emails from this domain belong to this organization</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="conditional">Conditional</option>
                <option value="whitelisted">Whitelisted</option>
                <option value="no_access">No Access</option>
              </select>
              <p className="mt-1 text-sm text-gray-600">{getStatusDescription(formData.status)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Internal notes about this organization..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

