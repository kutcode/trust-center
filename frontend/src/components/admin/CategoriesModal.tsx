'use client';

import { useState, useEffect, useRef } from 'react';
import { DocumentCategory } from '@/types';
import { apiRequestWithAuth } from '@/lib/api';

interface CategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string;
    onCategoriesUpdated: () => void;
}

export default function CategoriesModal({
    isOpen,
    onClose,
    token,
    onCategoriesUpdated,
}: CategoriesModalProps) {
    const [categories, setCategories] = useState<DocumentCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDescription, setNewCategoryDescription] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    // Delete confirmation state
    const [deletingCategory, setDeletingCategory] = useState<{ id: string, name: string } | null>(null);

    // Drag and drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragNode = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadCategories();
        }
    }, [isOpen]);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await apiRequestWithAuth<DocumentCategory[]>(
                '/api/document-categories',
                token
            );
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newCategoryName.trim()) return;

        setSaving(true);
        try {
            const maxOrder = Math.max(...categories.map(c => c.display_order || 0), 0);
            // Generate slug from name
            const slug = newCategoryName.trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            await apiRequestWithAuth('/api/document-categories', token, {
                method: 'POST',
                body: JSON.stringify({
                    name: newCategoryName.trim(),
                    slug: slug,
                    description: newCategoryDescription.trim() || null,
                    display_order: maxOrder + 1,
                }),
            });
            await loadCategories();
            setNewCategoryName('');
            setNewCategoryDescription('');
            setShowAddForm(false);
            onCategoriesUpdated();
        } catch (error: any) {
            alert(`Failed to add category: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async (id: string) => {
        if (!editName.trim()) return;

        setSaving(true);
        try {
            await apiRequestWithAuth(`/api/document-categories/${id}`, token, {
                method: 'PATCH',
                body: JSON.stringify({
                    name: editName.trim(),
                    description: editDescription.trim() || null,
                }),
            });
            await loadCategories();
            setEditingId(null);
            onCategoriesUpdated();
        } catch (error: any) {
            alert(`Failed to update category: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingCategory) return;

        const { id } = deletingCategory;
        setSaving(true);
        try {
            await apiRequestWithAuth(`/api/document-categories/${id}`, token, {
                method: 'DELETE',
            });
            await loadCategories();
            onCategoriesUpdated();
            setDeletingCategory(null);
        } catch (error: any) {
            alert(`Failed to delete category: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        dragNode.current = e.target as HTMLDivElement;
        dragNode.current.addEventListener('dragend', handleDragEnd);

        // Make drag image slightly transparent
        setTimeout(() => {
            if (dragNode.current) {
                dragNode.current.style.opacity = '0.5';
            }
        }, 0);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        if (draggedIndex === null) return;
        if (index !== draggedIndex) {
            setDragOverIndex(index);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Required for drop to work
    };

    const handleDragEnd = () => {
        if (dragNode.current) {
            dragNode.current.style.opacity = '1';
            dragNode.current.removeEventListener('dragend', handleDragEnd);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
        dragNode.current = null;
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) {
            handleDragEnd();
            return;
        }

        // Reorder locally first for instant feedback
        const newCategories = [...categories];
        const [draggedItem] = newCategories.splice(draggedIndex, 1);
        newCategories.splice(dropIndex, 0, draggedItem);
        setCategories(newCategories);

        handleDragEnd();

        // Update all display_orders in the backend
        setSaving(true);
        try {
            await Promise.all(
                newCategories.map((cat, idx) =>
                    apiRequestWithAuth(`/api/document-categories/${cat.id}`, token, {
                        method: 'PATCH',
                        body: JSON.stringify({ display_order: idx + 1 }),
                    })
                )
            );
            onCategoriesUpdated();
        } catch (error: any) {
            alert(`Failed to reorder: ${error.message}`);
            await loadCategories(); // Revert on error
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (category: DocumentCategory) => {
        setEditingId(category.id);
        setEditName(category.name);
        setEditDescription(category.description || '');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Edit Document Categories</h2>
                        <p className="text-sm text-gray-500 mt-1">Drag categories to reorder them</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                        </div>
                    ) : (
                        <>
                            {/* Categories List */}
                            <div className="space-y-2 mb-6">
                                {categories.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No categories yet. Add one below.</p>
                                ) : (
                                    categories.map((category, index) => (
                                        <div
                                            key={category.id}
                                            draggable={editingId !== category.id && !saving}
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragEnter={(e) => handleDragEnter(e, index)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, index)}
                                            className={`border rounded-lg p-4 bg-white transition-all ${dragOverIndex === index
                                                ? 'border-blue-500 border-2 bg-blue-50'
                                                : 'border-gray-200'
                                                } ${draggedIndex === index ? 'opacity-50' : ''
                                                } ${editingId !== category.id ? 'cursor-grab active:cursor-grabbing' : ''
                                                }`}
                                        >
                                            {editingId === category.id ? (
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        placeholder="Category name"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editDescription}
                                                        onChange={(e) => setEditDescription(e.target.value)}
                                                        placeholder="Description (optional)"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEdit(category.id)}
                                                            disabled={saving}
                                                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    {/* Drag Handle */}
                                                    <div className="flex-shrink-0 text-gray-400 cursor-grab">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                            <circle cx="9" cy="6" r="1.5" />
                                                            <circle cx="15" cy="6" r="1.5" />
                                                            <circle cx="9" cy="12" r="1.5" />
                                                            <circle cx="15" cy="12" r="1.5" />
                                                            <circle cx="9" cy="18" r="1.5" />
                                                            <circle cx="15" cy="18" r="1.5" />
                                                        </svg>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900">{category.name}</p>
                                                        {category.description && (
                                                            <p className="text-sm text-gray-500 truncate">{category.description}</p>
                                                        )}
                                                    </div>

                                                    <div
                                                        className="flex items-center gap-1 flex-shrink-0"
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        draggable={false}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startEdit(category);
                                                            }}
                                                            disabled={saving}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Edit"
                                                            draggable={false}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeletingCategory({ id: category.id, name: category.name });
                                                            }}
                                                            disabled={saving}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                            title="Delete"
                                                            draggable={false}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add Category Form */}
                            {showAddForm ? (
                                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                                    <h3 className="font-medium text-gray-900 mb-3">Add New Category</h3>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            placeholder="Category name *"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                        />
                                        <input
                                            type="text"
                                            value={newCategoryDescription}
                                            onChange={(e) => setNewCategoryDescription(e.target.value)}
                                            placeholder="Description (optional)"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleAdd}
                                                disabled={!newCategoryName.trim() || saving}
                                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                                            >
                                                {saving ? 'Adding...' : 'Add Category'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowAddForm(false);
                                                    setNewCategoryName('');
                                                    setNewCategoryDescription('');
                                                }}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                                >
                                    + Add New Category
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                    >
                        Done
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deletingCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Category?</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete <strong>"{deletingCategory.name}"</strong>?
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Documents in this category will become uncategorized.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingCategory(null)}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                            >
                                {saving ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
