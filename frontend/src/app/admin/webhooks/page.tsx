'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Webhook } from '@/types';
import WebhookModal from '@/components/admin/WebhookModal';
import toast from 'react-hot-toast';

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const supabase = createClient();

    const fetchWebhooks = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/outbound-webhooks`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setWebhooks(data);
            }
        } catch (error) {
            console.error('Error fetching webhooks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWebhooks();
    }, []);

    const handleDelete = async (id: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/outbound-webhooks/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            if (!response.ok) throw new Error('Failed to delete');

            toast.success('Webhook deleted');
            setDeleteConfirm(null);
            fetchWebhooks();
        } catch (error) {
            toast.error('Error deleting webhook');
        }
    };

    const handleTest = async (id: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const toastId = toast.loading('Sending test ping...');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/outbound-webhooks/${id}/test`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            const result = await response.json();

            if (result.success) {
                toast.success(`Ping success! Status: ${result.status}`, { id: toastId });
            } else {
                toast.error(`Ping failed. Status: ${result.status}`, { id: toastId });
            }
        } catch (error) {
            toast.error('Error sending test ping', { id: toastId });
        }
    };

    const getToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    };
    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        getToken().then(setToken);
    }, []);


    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Outbound Webhooks</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Configure webhooks to notify external systems about events.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    Add Webhook
                </button>
            </div>

            <WebhookModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                token={token}
                onSaved={fetchWebhooks}
            />

            <div className="bg-white shadow rounded-lg overflow-hidden">
                {webhooks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No webhooks configured.
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL / Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Secret</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {webhooks.map((hook) => (
                                <tr key={hook.id}>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 break-all">{hook.url}</div>
                                        {hook.description && (
                                            <div className="text-sm text-gray-500">{hook.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {hook.event_types.map(et => (
                                                <span key={et} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    {et}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-500">
                                        <span className="bg-gray-100 px-2 py-1 rounded select-all" title="Click to copy">
                                            {hook.secret.substring(0, 10)}...
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleTest(hook.id)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Test Ping
                                        </button>
                                        {deleteConfirm === hook.id ? (
                                            <span className="flex items-center justify-end gap-2">
                                                <span className="text-red-600 text-xs">Confirm?</span>
                                                <button
                                                    onClick={() => handleDelete(hook.id)}
                                                    className="text-red-600 hover:text-red-900 font-bold"
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    No
                                                </button>
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteConfirm(hook.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
