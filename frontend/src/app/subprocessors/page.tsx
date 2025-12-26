'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';

interface Subprocessor {
    id: string;
    name: string;
    purpose: string;
    data_location: string | null;
    website_url: string | null;
    category: string;
}

export default function SubprocessorsPage() {
    const [subprocessors, setSubprocessors] = useState<Subprocessor[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        loadSubprocessors();
    }, []);

    async function loadSubprocessors() {
        try {
            const data = await apiRequest<Subprocessor[]>('/api/subprocessors');
            setSubprocessors(data);
        } catch (error) {
            console.error('Failed to load subprocessors:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setSubscribeStatus('loading');
        try {
            await apiRequest('/api/subprocessors/subscribe', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            setSubscribeStatus('success');
            setEmail('');
        } catch (error) {
            setSubscribeStatus('error');
        }
    };

    // Group by category
    const groupedByCategory = subprocessors.reduce((acc, sub) => {
        const cat = sub.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(sub);
        return acc;
    }, {} as Record<string, Subprocessor[]>);

    const categoryIcons: Record<string, string> = {
        'Infrastructure': '🏗️',
        'Analytics': '📊',
        'Security': '🔒',
        'Communication': '💬',
        'Payment': '💳',
        'Support': '🎧',
        'Other': '📦',
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-16">
                    <div className="flex items-center gap-3 mb-4">
                        <Link href="/" className="text-gray-500 hover:text-gray-700">
                            Home
                        </Link>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-900">Subprocessors</span>
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">Subprocessors</h1>
                    <p className="text-xl text-gray-600 max-w-2xl">
                        A list of third-party service providers we use to process data on behalf of our customers.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Subscribe Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-blue-900">Stay Updated</h3>
                            <p className="text-blue-700 text-sm">
                                Subscribe to receive notifications when our subprocessor list changes.
                            </p>
                        </div>
                        {subscribeStatus === 'success' ? (
                            <div className="flex items-center gap-2 text-green-700 bg-green-100 px-4 py-2 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Subscribed successfully!
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    className="flex-1 md:w-64 px-4 py-2 border border-blue-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="submit"
                                    disabled={subscribeStatus === 'loading'}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {subscribeStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                                </button>
                            </form>
                        )}
                    </div>
                    {subscribeStatus === 'error' && (
                        <p className="text-red-600 text-sm mt-2">Failed to subscribe. Please try again.</p>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : subprocessors.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No subprocessors listed</h3>
                        <p className="text-gray-600">Our subprocessor list will be published here.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedByCategory).map(([category, subs]) => (
                            <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <span>{categoryIcons[category] || '📦'}</span>
                                        {category}
                                        <span className="text-sm font-normal text-gray-500">({subs.length})</span>
                                    </h2>
                                </div>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Purpose
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Data Location
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {subs.map((sub) => (
                                            <tr key={sub.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    {sub.website_url ? (
                                                        <a
                                                            href={sub.website_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-medium text-blue-600 hover:text-blue-700"
                                                        >
                                                            {sub.name}
                                                        </a>
                                                    ) : (
                                                        <span className="font-medium text-gray-900">{sub.name}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{sub.purpose}</td>
                                                <td className="px-6 py-4">
                                                    {sub.data_location ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                                                            🌍 {sub.data_location}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                )}

                {/* GDPR Notice */}
                <div className="mt-12 p-6 bg-gray-100 rounded-xl">
                    <div className="flex items-start gap-4">
                        <div className="text-2xl">ℹ️</div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">About This List</h3>
                            <p className="text-gray-600 text-sm">
                                In compliance with GDPR and other data protection regulations, we maintain this list of
                                subprocessors who may process personal data on our behalf. We will notify subscribers
                                of any changes to this list at least 30 days before engaging new subprocessors.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
