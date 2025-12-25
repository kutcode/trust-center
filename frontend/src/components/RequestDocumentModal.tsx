'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Document } from '@/types';

interface RequestDocumentModalProps {
    document: Document;
    isOpen: boolean;
    onClose: () => void;
}

export default function RequestDocumentModal({ document, isOpen, onClose }: RequestDocumentModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        reason: '',
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        try {
            await apiRequest<{ success: boolean; message: string }>('/api/document-requests', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    document_ids: [document.id],
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
        setFormData({ name: '', email: '', company: '', reason: '' });
        setStatus('idle');
        setErrorMessage('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Request Document Access</h2>
                        <p className="mt-2 text-gray-600">
                            Requesting access to: <span className="font-medium text-gray-900">{document.title}</span>
                        </p>
                    </div>

                    {/* Success State */}
                    {status === 'success' ? (
                        <div className="text-center py-8">
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
                                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Error Message */}
                            {status === 'error' && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                                    {errorMessage || 'Failed to submit request. Please try again.'}
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="modal-name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="modal-name"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Work Email *
                                    </label>
                                    <input
                                        type="email"
                                        id="modal-email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        We'll send the access link to this email
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="modal-company" className="block text-sm font-medium text-gray-700 mb-1">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="modal-company"
                                        name="company"
                                        required
                                        value={formData.company}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="modal-reason" className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason for Request *
                                    </label>
                                    <textarea
                                        id="modal-reason"
                                        name="reason"
                                        required
                                        rows={3}
                                        value={formData.reason}
                                        onChange={handleChange}
                                        placeholder="Please explain why you need access to this document..."
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'submitting'}
                                    className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
