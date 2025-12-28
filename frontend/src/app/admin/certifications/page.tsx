'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import TableSkeleton from '@/components/ui/TableSkeleton';

interface Certification {
    id: string;
    name: string;
    issuer: string;
    issue_date: string | null;
    expiry_date: string | null;
    certificate_image_url: string | null;
    description: string | null;
    status: 'active' | 'inactive';
    display_order: number;
}

// Pre-built badge icons for common certifications
const certificationBadges: { [key: string]: { icon: string; color: string } } = {
    'soc2': { icon: '🛡️', color: 'bg-blue-100 text-blue-700' },
    'soc 2': { icon: '🛡️', color: 'bg-blue-100 text-blue-700' },
    'iso 27001': { icon: '🏆', color: 'bg-purple-100 text-purple-700' },
    'iso27001': { icon: '🏆', color: 'bg-purple-100 text-purple-700' },
    'hipaa': { icon: '🏥', color: 'bg-green-100 text-green-700' },
    'gdpr': { icon: '🇪🇺', color: 'bg-indigo-100 text-indigo-700' },
    'pci': { icon: '💳', color: 'bg-orange-100 text-orange-700' },
    'pci-dss': { icon: '💳', color: 'bg-orange-100 text-orange-700' },
    'fedramp': { icon: '🏛️', color: 'bg-red-100 text-red-700' },
    'ccpa': { icon: '🌴', color: 'bg-yellow-100 text-yellow-700' },
    'default': { icon: '✓', color: 'bg-gray-100 text-gray-700' },
};

function getBadge(name: string) {
    const lowerName = name.toLowerCase();
    for (const [key, badge] of Object.entries(certificationBadges)) {
        if (lowerName.includes(key)) return badge;
    }
    return certificationBadges.default;
}

export default function CertificationsAdminPage() {
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCert, setEditingCert] = useState<Certification | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<Certification | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: '',
        issuer: '',
        issue_date: '',
        expiry_date: '',
        description: '',
        status: 'active' as 'active' | 'inactive',
    });

    useEffect(() => {
        loadCertifications();
    }, []);

    async function loadCertifications() {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) return;

            setToken(session.access_token);
            const data = await apiRequestWithAuth<Certification[]>(
                '/api/certifications?include_inactive=true',
                session.access_token
            );
            setCertifications(data);
        } catch (error) {
            console.error('Failed to load certifications:', error);
            toast.error('Failed to load certifications');
        } finally {
            setLoading(false);
        }
    }

    const openAddModal = () => {
        setEditingCert(null);
        setForm({
            name: '',
            issuer: '',
            issue_date: '',
            expiry_date: '',
            description: '',
            status: 'active',
        });
        setShowModal(true);
    };

    const openEditModal = (cert: Certification) => {
        setEditingCert(cert);
        setForm({
            name: cert.name,
            issuer: cert.issuer,
            issue_date: cert.issue_date || '',
            expiry_date: cert.expiry_date || '',
            description: cert.description || '',
            status: cert.status,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setSaving(true);
        try {
            const payload = {
                ...form,
                issue_date: form.issue_date || null,
                expiry_date: form.expiry_date || null,
                description: form.description || null,
            };

            if (editingCert) {
                await apiRequestWithAuth(`/api/certifications/${editingCert.id}`, token, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                });
                toast.success('Certification updated successfully');
            } else {
                const maxOrder = Math.max(...certifications.map(c => c.display_order || 0), 0);
                await apiRequestWithAuth('/api/certifications', token, {
                    method: 'POST',
                    body: JSON.stringify({ ...payload, display_order: maxOrder + 1 }),
                });
                toast.success('Certification create successfully');
            }

            await loadCertifications();
            setShowModal(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to save certification');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm || !token) return;

        setSaving(true);
        try {
            await apiRequestWithAuth(`/api/certifications/${deleteConfirm.id}`, token, {
                method: 'DELETE',
            });
            toast.success('Certification deleted');
            await loadCertifications();
            setDeleteConfirm(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete certification');
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (cert: Certification) => {
        if (!token) return;

        try {
            const newStatus = cert.status === 'active' ? 'inactive' : 'active';
            await apiRequestWithAuth(`/api/certifications/${cert.id}`, token, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });
            await loadCertifications();
            toast.success(`Status updated to ${newStatus}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update status');
        }
    };

    const getExpiryStatus = (expiryDate: string | null) => {
        if (!expiryDate) return null;
        const expiry = new Date(expiryDate);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
            return { label: 'Expired', class: 'bg-red-100 text-red-700' };
        } else if (daysUntilExpiry <= 30) {
            return { label: 'Expiring Soon', class: 'bg-amber-100 text-amber-700' };
        } else {
            return { label: 'Valid', class: 'bg-green-100 text-green-700' };
        }
    };

    if (loading) {
        return <div className="p-6"><TableSkeleton columns={5} rows={6} /></div>;
    }

    return (
        <div className="space-y-6">
            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Delete Certification"
                message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
                isLoading={saving}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Certifications</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage your compliance certifications and badges
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Certification
                </button>
            </div>

            {/* Certifications Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {certifications.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">🏆</div>
                        <h3 className="text-lg font-medium text-gray-900">No certifications</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            Add your first certification to display on your Trust Center
                        </p>
                        <button
                            onClick={openAddModal}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                            Add Certification
                        </button>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Certification
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Issuer
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Validity
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {certifications.map((cert) => {
                                const badge = getBadge(cert.name);
                                const expiryStatus = getExpiryStatus(cert.expiry_date);

                                return (
                                    <tr key={cert.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg ${badge.color}`}>
                                                    {badge.icon}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-gray-900">{cert.name}</p>
                                                    {cert.description && (
                                                        <p className="text-sm text-gray-500 truncate max-w-xs">{cert.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-700">{cert.issuer}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                {cert.issue_date && (
                                                    <span className="text-xs text-gray-500">
                                                        Issued: {new Date(cert.issue_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {cert.expiry_date && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500">
                                                            Expires: {new Date(cert.expiry_date).toLocaleDateString()}
                                                        </span>
                                                        {expiryStatus && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${expiryStatus.class}`}>
                                                                {expiryStatus.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {!cert.issue_date && !cert.expiry_date && (
                                                    <span className="text-xs text-gray-400">No dates set</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => toggleStatus(cert)}
                                                className={`px-2.5 py-1 text-xs font-medium rounded-full ${cert.status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {cert.status === 'active' ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(cert)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(cert)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingCert ? 'Edit Certification' : 'Add Certification'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Certification Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g., SOC 2 Type II, ISO 27001"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Issuer <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.issuer}
                                    onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                                    placeholder="e.g., AICPA, ISO"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Issue Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.issue_date}
                                        onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Expiry Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.expiry_date}
                                        onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Brief description of the certification..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="active">Active (visible to public)</option>
                                    <option value="inactive">Inactive (hidden)</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
                                >
                                    {saving ? 'Saving...' : editingCert ? 'Save Changes' : 'Add Certification'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
