'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, MessageSquare } from 'lucide-react';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title: string;
    message?: string;
    placeholder?: string;
    confirmLabel?: string;
    isLoading?: boolean;
    initialValue?: string;
}

export default function InputModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    placeholder = 'Type here...',
    confirmLabel = 'Submit',
    isLoading = false,
    initialValue = '',
}: InputModalProps) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue);
        }
    }, [isOpen, initialValue]);

    return (
        <Dialog open={isOpen} onClose={isLoading ? () => undefined : onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-700">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                            {title}
                        </DialogTitle>
                        <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" aria-label="Close dialog">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {message && <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>}

                    <textarea
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full h-32 px-3 py-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-6"
                        disabled={isLoading}
                        autoFocus
                    />

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(value)}
                            disabled={isLoading}
                            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {isLoading && (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )}
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </DialogPanel>
            </div>
        </Dialog>
    );
}
