'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import TableSkeleton from '@/components/ui/TableSkeleton';

interface SecurityUpdate {
    id: string;
    title: string;
    content: string;
    severity: 'low' | 'medium' | 'high' | 'critical' | null;
    published_at: string | null;
    created_at: string;
}

const severityOptions = [
    { value: '', label: 'None', color: 'bg-gray-100 text-gray-700' },
    { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-700' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
];

function getSeverityColor(severity: string | null): string {
    const option = severityOptions.find(o => o.value === severity);
    return option?.color || 'bg-gray-100 text-gray-700';
}

export default function SecurityUpdatesAdminPage() {
    const [updates, setUpdates] = useState<SecurityUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState<SecurityUpdate | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<SecurityUpdate | null>(null);

    // Form state
    const [form, setForm] = useState({
        title: '',
        content: '',
        severity: '' as string,
        published_at: '',
    });

    useEffect(() => {
        loadUpdates();
    }, []);

    async function loadUpdates() {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) return;

            setToken(session.access_token);
            const data = await apiRequestWithAuth<SecurityUpdate[]>(
                '/api/security-updates?include_unpublished=true',
                session.access_token
            );
            setUpdates(data);
        } catch (error) {
            console.error('Failed to load security updates:', error);
            toast.error('Failed to load security updates');
        } finally {
            setLoading(false);
        }
    }

    const openAddModal = () => {
        setEditingUpdate(null);
        setForm({
            title: '',
            content: '',
            severity: '',
            published_at: '',
        });
        setShowModal(true);
    };

    const openEditModal = (update: SecurityUpdate) => {
        setEditingUpdate(update);
        setForm({
            title: update.title,
            content: update.content,
            severity: update.severity || '',
            published_at: update.published_at ? update.published_at.split('T')[0] : '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setSaving(true);
        try {
            const payload = {
                title: form.title,
                content: form.content,
                severity: form.severity || null,
                published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
            };

            if (editingUpdate) {
                await apiRequestWithAuth(`/api/security-updates/${editingUpdate.id}`, token, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                });
                toast.success('Security update saved successfully');
            } else {
                await apiRequestWithAuth('/api/security-updates', token, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                toast.success('Security update created successfully');
            }

            await loadUpdates();
            setShowModal(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to save security update');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm || !token) return;

        setSaving(true);
        try {
            await apiRequestWithAuth(`/api/security-updates/${deleteConfirm.id}`, token, {
                method: 'DELETE',
            });
            toast.success('Security update deleted');
            await loadUpdates();
            setDeleteConfirm(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete security update');
        } finally {
            setSaving(false);
        }
    };

    const togglePublish = async (update: SecurityUpdate) => {
        if (!token) return;

        try {
            const newPublishedAt = update.published_at ? null : new Date().toISOString();
            await apiRequestWithAuth(`/api/security-updates/${update.id}`, token, {
                method: 'PATCH',
                body: JSON.stringify({ published_at: newPublishedAt }),
            });
            await loadUpdates();
            toast.success(newPublishedAt ? 'Published' : 'Unpublished');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update status');
        }
    };

    if (loading) {
        return <div className="p-6"><TableSkeleton columns={4} rows={6} /></div>;
    }

    return (
        <div className="space-y-6">
            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Delete Security Update"
                message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
                isLoading={saving}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Security Updates</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage security advisories and announcements
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Update
                </button>
            </div>

            {/* Updates Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {updates.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">📢</div>
                        <h3 className="text-lg font-medium text-gray-900">No security updates</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            Add your first security update to inform your users
                        </p>
                        <button
                            onClick={openAddModal}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                            Add Security Update
                        </button>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Title
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Severity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {updates.map((update) => (
                                <tr key={update.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{update.title}</p>
                                            <p className="text-sm text-gray-500 truncate max-w-md">
                                                {update.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {update.severity ? (
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getSeverityColor(update.severity)}`}>
                                                {update.severity.charAt(0).toUpperCase() + update.severity.slice(1)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => togglePublish(update)}
                                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${update.published_at
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {update.published_at ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">
                                            {update.published_at
                                                ? new Date(update.published_at).toLocaleDateString()
                                                : new Date(update.created_at).toLocaleDateString() + ' (created)'
                                            }
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(update)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(update)}
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
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingUpdate ? 'Edit Security Update' : 'Add Security Update'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g., Security Advisory: Authentication Update"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Content <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={8}
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    placeholder="Describe the security update in detail. HTML is supported."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    You can use HTML for formatting (e.g., &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;)
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Severity
                                    </label>
                                    <select
                                        value={form.severity}
                                        onChange={(e) => setForm({ ...form, severity: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    >
                                        {severityOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Publish Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.published_at}
                                        onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Leave empty to save as draft
                                    </p>
                                </div>
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
                                    {saving ? 'Saving...' : editingUpdate ? 'Save Changes' : 'Add Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
