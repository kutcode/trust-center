'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import GlobalRequestDocumentModal from '@/components/GlobalRequestDocumentModal';

interface SearchResult {
    id: string;
    type: 'document' | 'control' | 'certification' | 'update';
    title: string;
    description?: string;
    category?: string;
    url: string;
}

interface HeaderClientProps {
    companyName: string;
    primaryColor: string;
    logoUrl?: string;
}

export default function HeaderClient({ companyName, primaryColor, logoUrl }: HeaderClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Close search results when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search functionality
    useEffect(() => {
        const searchTimeout = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                setShowSearchResults(false);
                return;
            }

            setIsSearching(true);
            try {
                // Search across multiple content types
                const [documents, controls, certifications, updates] = await Promise.all([
                    apiRequest<any[]>('/api/documents'),
                    apiRequest<any[]>('/api/controls'),
                    apiRequest<any[]>('/api/certifications'),
                    apiRequest<any[]>('/api/security-updates'),
                ]);

                const query = searchQuery.toLowerCase();
                const results: SearchResult[] = [];

                // Search documents
                documents.forEach(doc => {
                    if (doc.title?.toLowerCase().includes(query) || doc.description?.toLowerCase().includes(query)) {
                        results.push({
                            id: doc.id,
                            type: 'document',
                            title: doc.title,
                            description: doc.description,
                            category: doc.document_categories?.name,
                            url: '/documents',
                        });
                    }
                });

                // Search controls
                controls.forEach(control => {
                    if (control.title?.toLowerCase().includes(query) || control.description?.toLowerCase().includes(query)) {
                        results.push({
                            id: control.id,
                            type: 'control',
                            title: control.title,
                            description: control.description,
                            category: control.control_categories?.name,
                            url: `/controls#${control.category_id}`,
                        });
                    }
                });

                // Search certifications
                certifications.forEach(cert => {
                    if (cert.name?.toLowerCase().includes(query) || cert.description?.toLowerCase().includes(query)) {
                        results.push({
                            id: cert.id,
                            type: 'certification',
                            title: cert.name,
                            description: cert.description,
                            url: '/certifications',
                        });
                    }
                });

                // Search security updates
                updates.forEach(update => {
                    if (update.title?.toLowerCase().includes(query) || update.content?.toLowerCase().includes(query)) {
                        results.push({
                            id: update.id,
                            type: 'update',
                            title: update.title,
                            description: update.content?.replace(/<[^>]*>/g, '').substring(0, 100),
                            url: '/security-updates',
                        });
                    }
                });

                setSearchResults(results.slice(0, 10)); // Limit to 10 results
                setShowSearchResults(true);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300); // Debounce search

        return () => clearTimeout(searchTimeout);
    }, [searchQuery]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'document':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'control':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                );
            case 'certification':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                );
            case 'update':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'document':
                return 'bg-blue-100 text-blue-700';
            case 'control':
                return 'bg-green-100 text-green-700';
            case 'certification':
                return 'bg-purple-100 text-purple-700';
            case 'update':
                return 'bg-amber-100 text-amber-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const handleResultClick = (result: SearchResult) => {
        setShowSearchResults(false);
        setSearchQuery('');
        router.push(result.url);
    };

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    return (
        <>
            <header className={`bg-white shadow-sm border-b border-gray-200 sticky ${isDemoMode ? 'top-10' : 'top-0'} z-40`}>
                <div className="container mx-auto px-4 py-3">
                    <nav className="flex items-center justify-between gap-4">
                        {/* Logo */}
                        <Link
                            href="/"
                            className="hover:opacity-80 transition-opacity flex-shrink-0"
                        >
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={companyName || 'Trust Center'}
                                    className="h-8 w-auto object-contain"
                                />
                            ) : (
                                <span
                                    className="text-xl font-bold"
                                    style={{ color: primaryColor || '#111827' }}
                                >
                                    {companyName || 'Trust Center'}
                                </span>
                            )}
                        </Link>

                        {/* Search Bar */}
                        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
                            <div className="relative">
                                <svg
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search documents, controls, updates..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {showSearchResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                                    </div>
                                    {searchResults.map((result) => (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            onClick={() => handleResultClick(result)}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0 flex items-start gap-3"
                                        >
                                            <div className={`p-1.5 rounded ${getTypeBadgeColor(result.type)}`}>
                                                {getTypeIcon(result.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 truncate">
                                                        {result.title}
                                                    </span>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${getTypeBadgeColor(result.type)}`}>
                                                        {result.type}
                                                    </span>
                                                </div>
                                                {result.description && (
                                                    <p className="text-sm text-gray-500 truncate mt-0.5">
                                                        {result.description}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* No Results */}
                            {showSearchResults && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                                    No results found for "{searchQuery}"
                                </div>
                            )}
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden lg:flex items-center gap-5">
                            <Link
                                href="/documents"
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                            >
                                Documents
                            </Link>
                            <Link
                                href="/controls"
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                            >
                                Controls
                            </Link>
                            <Link
                                href="/certifications"
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                            >
                                Certifications
                            </Link>
                            <Link
                                href="/security-updates"
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                            >
                                Updates
                            </Link>
                        </div>

                        {/* Request Documents Button */}
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="flex-shrink-0 px-4 py-2 border border-gray-900 text-gray-900 rounded-lg font-medium hover:bg-gray-900 hover:text-white transition-colors text-sm"
                        >
                            Request documents
                        </button>
                    </nav>
                </div>
            </header>

            {/* Global Request Document Modal */}
            <GlobalRequestDocumentModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
            />
        </>
    );
}
