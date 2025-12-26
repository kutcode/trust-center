'use client';

import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api';
import { Document, DocumentCategory } from '@/types';

interface RequestDocumentModalProps {
    initialDocument: Document;
    isOpen: boolean;
    onClose: () => void;
}

interface DocumentWithCategory extends Document {
    category?: DocumentCategory;
}

export default function RequestDocumentModal({ initialDocument, isOpen, onClose }: RequestDocumentModalProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        message: '',
    });
    const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([initialDocument]);
    const [allDocuments, setAllDocuments] = useState<DocumentWithCategory[]>([]);
    const [categories, setCategories] = useState<DocumentCategory[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch all restricted documents and categories
    useEffect(() => {
        async function fetchDocumentsAndCategories() {
            try {
                const [docs, cats] = await Promise.all([
                    apiRequest<Document[]>('/api/documents'),
                    apiRequest<DocumentCategory[]>('/api/document-categories'),
                ]);
                // Only show restricted documents
                const restrictedDocs = docs.filter(d => d.access_level === 'restricted' && d.status === 'published');
                setAllDocuments(restrictedDocs);
                setCategories(cats);
            } catch (error) {
                console.error('Failed to fetch documents:', error);
            }
        }
        if (isOpen) {
            fetchDocumentsAndCategories();
            setSelectedDocuments([initialDocument]);
        }
    }, [isOpen, initialDocument]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        try {
            await apiRequest<{ success: boolean; message: string }>('/api/document-requests', {
                method: 'POST',
                body: JSON.stringify({
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    email: formData.email,
                    company: formData.company,
                    reason: formData.message,
                    document_ids: selectedDocuments.map(d => d.id),
                }),
            });
            setStatus('success');
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Failed to submit request');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleClose = () => {
        setFormData({ firstName: '', lastName: '', email: '', company: '', message: '' });
        setSelectedDocuments([initialDocument]);
        setStatus('idle');
        setErrorMessage('');
        setIsDropdownOpen(false);
        setSearchQuery('');
        onClose();
    };

    const toggleDocument = (doc: Document) => {
        const isSelected = selectedDocuments.some(d => d.id === doc.id);
        if (isSelected) {
            // Don't allow removing the last document
            if (selectedDocuments.length > 1) {
                setSelectedDocuments(selectedDocuments.filter(d => d.id !== doc.id));
            }
        } else {
            setSelectedDocuments([...selectedDocuments, doc]);
        }
    };

    const removeDocument = (docId: string) => {
        if (selectedDocuments.length > 1) {
            setSelectedDocuments(selectedDocuments.filter(d => d.id !== docId));
        }
    };

    const selectAll = () => {
        setSelectedDocuments([...allDocuments]);
    };

    // Group documents by category
    const groupedDocuments = categories.map(category => ({
        category,
        documents: allDocuments.filter(doc => doc.category_id === category.id),
    })).filter(group => group.documents.length > 0);

    // Add uncategorized documents
    const uncategorizedDocs = allDocuments.filter(doc => !doc.category_id);
    if (uncategorizedDocs.length > 0) {
        groupedDocuments.push({
            category: { id: 'uncategorized', name: 'Other Documents', description: '' } as DocumentCategory,
            documents: uncategorizedDocs,
        });
    }

    // Filter by search query
    const filteredGroups = groupedDocuments.map(group => ({
        ...group,
        documents: group.documents.filter(doc =>
            doc.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    })).filter(group => group.documents.length > 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors z-10"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900">Request Information</h2>
                    </div>

                    {/* Success State */}
                    {status === 'success' ? (
                        <div className="px-8 py-12 text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted!</h3>
                            <p className="text-gray-600 mb-6">
                                We'll review your request and send you an email with access instructions if approved.
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <div className="px-8 py-6">
                            {/* Error Message */}
                            {status === 'error' && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {errorMessage || 'Failed to submit request. Please try again.'}
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Document Selector */}
                                <div ref={dropdownRef}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Documents <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        className="relative"
                                    >
                                        <div
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 transition-colors flex flex-wrap gap-1.5 items-center"
                                        >
                                            {selectedDocuments.map(doc => (
                                                <span
                                                    key={doc.id}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm"
                                                >
                                                    {doc.title}
                                                    {selectedDocuments.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeDocument(doc.id);
                                                            }}
                                                            className="hover:text-blue-900"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </span>
                                            ))}
                                            <svg
                                                className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>

                                        {/* Dropdown */}
                                        {isDropdownOpen && (
                                            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                                                {/* Search */}
                                                <div className="p-2 border-b border-gray-100">
                                                    <input
                                                        type="text"
                                                        placeholder="Search documents..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>

                                                {/* Select All */}
                                                <button
                                                    type="button"
                                                    onClick={selectAll}
                                                    className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 border-b border-gray-100"
                                                >
                                                    Select all
                                                </button>

                                                {/* Document List */}
                                                <div className="max-h-60 overflow-y-auto pb-2">
                                                    {filteredGroups.map(group => (
                                                        <div key={group.category.id}>
                                                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 sticky top-0">
                                                                {group.category.name}
                                                            </div>
                                                            {group.documents.map(doc => (
                                                                <label
                                                                    key={doc.id}
                                                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedDocuments.some(d => d.id === doc.id)}
                                                                        onChange={() => toggleDocument(doc)}
                                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                    />
                                                                    <span className="text-sm text-gray-700">{doc.title}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* First Name & Last Name Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            required
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            required
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        placeholder="you@company.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
                                    />
                                </div>

                                {/* Company */}
                                <div>
                                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="company"
                                        name="company"
                                        required
                                        value={formData.company}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={3}
                                        maxLength={1000}
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Tell us why you need access to these documents..."
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none text-sm"
                                    />
                                    <p className="mt-1 text-xs text-gray-400 text-right">
                                        {formData.message.length} / 1000
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={status === 'submitting' || selectedDocuments.length === 0}
                                    className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    {status === 'submitting' ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Submitting...
                                        </span>
                                    ) : (
                                        'Submit Request'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
