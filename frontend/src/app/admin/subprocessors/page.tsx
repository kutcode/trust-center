'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import TableSkeleton from '@/components/ui/TableSkeleton';

interface Subprocessor {
    id: string;
    name: string;
    purpose: string;
    data_location: string | null;
    website_url: string | null;
    category: string;
    is_active: boolean;
    display_order: number;
}

const categories = [
    'Infrastructure',
    'Analytics',
    'Security',
    'Communication',
    'Payment',
    'Support',
    'Other',
];

export default function SubprocessorsAdminPage() {
    const [subprocessors, setSubprocessors] = useState<Subprocessor[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingSub, setEditingSub] = useState<Subprocessor | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<Subprocessor | null>(null);

    const [form, setForm] = useState({
        name: '',
        purpose: '',
        data_location: '',
        website_url: '',
        category: 'Infrastructure',
        is_active: true,
    });

    useEffect(() => {
        loadSubprocessors();
    }, []);

    async function loadSubprocessors() {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) return;

            setToken(session.access_token);
            const data = await apiRequestWithAuth<Subprocessor[]>(
                '/api/subprocessors?include_inactive=true',
                session.access_token
            );
            setSubprocessors(data);
        } catch (error) {
            console.error('Failed to load subprocessors:', error);
            toast.error('Failed to load subprocessors');
        } finally {
            setLoading(false);
        }
    }

    const openAddModal = () => {
        setEditingSub(null);
        setForm({
            name: '',
            purpose: '',
            data_location: '',
            website_url: '',
            category: 'Infrastructure',
            is_active: true,
        });
        setShowModal(true);
    };

    const openEditModal = (sub: Subprocessor) => {
        setEditingSub(sub);
        setForm({
            name: sub.name,
            purpose: sub.purpose,
            data_location: sub.data_location || '',
            website_url: sub.website_url || '',
            category: sub.category,
            is_active: sub.is_active,
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
                data_location: form.data_location || null,
                website_url: form.website_url || null,
            };

            if (editingSub) {
                await apiRequestWithAuth(`/api/subprocessors/${editingSub.id}`, token, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                });
                toast.success('Subprocessor updated successfully');
            } else {
                const maxOrder = Math.max(...subprocessors.map(s => s.display_order || 0), 0);
                await apiRequestWithAuth('/api/subprocessors', token, {
                    method: 'POST',
                    body: JSON.stringify({ ...payload, display_order: maxOrder + 1 }),
                });
                toast.success('Subprocessor created successfully');
            }

            await loadSubprocessors();
            setShowModal(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to save subprocessor');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm || !token) return;

        setSaving(true);
        try {
            await apiRequestWithAuth(`/api/subprocessors/${deleteConfirm.id}`, token, {
                method: 'DELETE',
            });
            toast.success('Subprocessor deleted successfully');
            await loadSubprocessors();
            setDeleteConfirm(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete subprocessor');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (sub: Subprocessor) => {
        if (!token) return;

        try {
            await apiRequestWithAuth(`/api/subprocessors/${sub.id}`, token, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !sub.is_active }),
            });
            await loadSubprocessors();
            toast.success(`Subprocessor ${sub.is_active ? 'deactivated' : 'activated'}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update status');
        }
    };

    if (loading) {
        return <div className="p-6"><TableSkeleton columns={6} rows={6} /></div>;
    }

    return (
        <div className="space-y-6">
            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Delete Subprocessor"
                message={`Are you sure you want to delete "${deleteConfirm?.name}"? This cannot be undone.`}
                isLoading={saving}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subprocessors</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage third-party vendors for GDPR compliance
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Subprocessor
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {subprocessors.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">📋</div>
                        <h3 className="text-lg font-medium text-gray-900">No subprocessors</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            Add your first subprocessor for GDPR compliance
                        </p>
                        <button
                            onClick={openAddModal}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                            Add Subprocessor
                        </button>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Purpose
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Category
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Location
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
                            {subprocessors.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{sub.name}</p>
                                            {sub.website_url && (
                                                <a
                                                    href={sub.website_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    {sub.website_url}
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-gray-600">{sub.purpose}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-gray-700">{sub.category}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {sub.data_location ? (
                                            <span className="text-sm text-gray-600">{sub.data_location}</span>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => toggleActive(sub)}
                                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${sub.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {sub.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(sub)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(sub)}
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
                            ))}
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
                                {editingSub ? 'Edit Subprocessor' : 'Add Subprocessor'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g., Amazon Web Services"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Purpose <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.purpose}
                                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                                    placeholder="e.g., Cloud infrastructure hosting"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Data Location
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data_location}
                                        onChange={(e) => setForm({ ...form, data_location: e.target.value })}
                                        placeholder="e.g., USA, EU"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Website URL
                                </label>
                                <input
                                    type="url"
                                    value={form.website_url}
                                    onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                                    placeholder="https://example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">
                                    Active (visible on public page)
                                </label>
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
                                    {saving ? 'Saving...' : editingSub ? 'Save Changes' : 'Add Subprocessor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

