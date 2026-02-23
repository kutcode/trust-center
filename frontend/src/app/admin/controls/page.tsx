'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface ControlCategory {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    sort_order: number;
}

interface Control {
    id: string;
    category_id: string;
    title: string;
    description?: string;
    sort_order: number;
}

const EMOJI_OPTIONS = ['🔒', '🛡️', '👥', '🔑', '📋', '🖥️', '☁️', '📡', '🔍', '📊', '⚡', '🏢', '🔐', '📱', '🌐'];

export default function AdminControlsPage() {
    const [categories, setCategories] = useState<ControlCategory[]>([]);
    const [controls, setControls] = useState<Control[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showControlModal, setShowControlModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ControlCategory | null>(null);
    const [editingControl, setEditingControl] = useState<Control | null>(null);

    const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '🔒', banner_image: '' });
    const [controlForm, setControlForm] = useState({ title: '', description: '', category_id: '' });
    const [deleteConfirm, setDeleteConfirm] = useState<
        | { type: 'category'; id: string; label: string }
        | { type: 'control'; id: string; label: string }
        | null
    >(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // Helper to get fresh token (avoids stale token issues)
    async function getToken(): Promise<string | null> {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setToken(session.access_token);
            return session.access_token;
        }
        return null;
    }

    async function loadData() {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setToken(session.access_token);
            try {
                const [cats, ctrls] = await Promise.all([
                    apiRequestWithAuth<ControlCategory[]>('/api/admin/control-categories', session.access_token),
                    apiRequestWithAuth<Control[]>('/api/admin/controls', session.access_token),
                ]);
                setCategories([...cats].sort((a, b) => a.sort_order - b.sort_order));
                setControls(ctrls);
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        }
        setLoading(false);
    }

    // Handle category drag end
    async function handleCategoryDragEnd(result: DropResult) {
        if (!result.destination) return;

        const items = Array.from(categories);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update local state immediately
        const updatedCategories = items.map((item, index) => ({ ...item, sort_order: index }));
        setCategories(updatedCategories);

        // Save to backend with fresh token
        try {
            const freshToken = await getToken();
            if (!freshToken) throw new Error('Not authenticated');
            await apiRequestWithAuth('/api/admin/control-categories/reorder', freshToken, {
                method: 'PATCH',
                body: JSON.stringify({ orders: updatedCategories.map(c => ({ id: c.id, sort_order: c.sort_order })) }),
            });
            toast.success('Category order saved');
        } catch (error: any) {
            toast.error('Failed to save order');
            loadData(); // Revert on error
        }
    }

    // Handle control drag end within a category
    async function handleControlDragEnd(categoryId: string, result: DropResult) {
        if (!result.destination) return;

        const categoryControls = controls
            .filter(c => c.category_id === categoryId)
            .sort((a, b) => a.sort_order - b.sort_order);

        const items = Array.from(categoryControls);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update local state
        const updatedItems = items.map((item, index) => ({ ...item, sort_order: index }));
        const otherControls = controls.filter(c => c.category_id !== categoryId);
        setControls([...otherControls, ...updatedItems]);

        // Save to backend with fresh token
        try {
            const freshToken = await getToken();
            if (!freshToken) throw new Error('Not authenticated');
            await apiRequestWithAuth('/api/admin/controls/reorder', freshToken, {
                method: 'PATCH',
                body: JSON.stringify({ orders: updatedItems.map(c => ({ id: c.id, sort_order: c.sort_order })) }),
            });
            toast.success('Control order saved');
        } catch (error: any) {
            toast.error('Failed to save order');
            loadData();
        }
    }

    async function saveCategory() {
        try {
            const freshToken = await getToken();
            if (!freshToken) throw new Error('Not authenticated');
            if (editingCategory) {
                await apiRequestWithAuth(`/api/admin/control-categories/${editingCategory.id}`, freshToken, {
                    method: 'PATCH',
                    body: JSON.stringify(categoryForm),
                });
                toast.success('Category updated');
            } else {
                await apiRequestWithAuth('/api/admin/control-categories', freshToken, {
                    method: 'POST',
                    body: JSON.stringify(categoryForm),
                });
                toast.success('Category created');
            }
            setShowCategoryModal(false);
            setCategoryForm({ name: '', description: '', icon: '🔒', banner_image: '' });
            setEditingCategory(null);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save category');
        }
    }

    async function deleteCategory(id: string) {
        try {
            setDeleting(true);
            const freshToken = await getToken();
            if (!freshToken) throw new Error('Not authenticated');
            await apiRequestWithAuth(`/api/admin/control-categories/${id}`, freshToken, { method: 'DELETE' });
            toast.success('Category deleted');
            setDeleteConfirm(null);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete category');
        } finally {
            setDeleting(false);
        }
    }

    async function saveControl() {
        try {
            const freshToken = await getToken();
            if (!freshToken) throw new Error('Not authenticated');
            if (editingControl) {
                await apiRequestWithAuth(`/api/admin/controls/${editingControl.id}`, freshToken, {
                    method: 'PATCH',
                    body: JSON.stringify(controlForm),
                });
                toast.success('Control updated');
            } else {
                await apiRequestWithAuth('/api/admin/controls', freshToken, {
                    method: 'POST',
                    body: JSON.stringify(controlForm),
                });
                toast.success('Control created');
            }
            setShowControlModal(false);
            setControlForm({ title: '', description: '', category_id: '' });
            setEditingControl(null);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save control');
        }
    }

    async function deleteControl(id: string) {
        try {
            setDeleting(true);
            const freshToken = await getToken();
            if (!freshToken) throw new Error('Not authenticated');
            await apiRequestWithAuth(`/api/admin/controls/${id}`, freshToken, { method: 'DELETE' });
            toast.success('Control deleted');
            setDeleteConfirm(null);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete control');
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => {
                    if (!deleteConfirm) return;
                    if (deleteConfirm.type === 'category') {
                        void deleteCategory(deleteConfirm.id);
                    } else {
                        void deleteControl(deleteConfirm.id);
                    }
                }}
                title={deleteConfirm?.type === 'category' ? 'Delete Category' : 'Delete Control'}
                message={
                    deleteConfirm?.type === 'category'
                        ? `Delete "${deleteConfirm.label}"? All controls in it will also be deleted.`
                        : `Delete "${deleteConfirm?.label}"?`
                }
                confirmLabel="Delete"
                isLoading={deleting}
            />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Security Controls</h1>
                    <p className="text-gray-500 text-sm mt-1">Drag categories or controls to reorder them</p>
                </div>
                <button
                    onClick={() => {
                        setCategoryForm({ name: '', description: '', icon: '🔒', banner_image: '' });
                        setEditingCategory(null);
                        setShowCategoryModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Category
                </button>
            </div>

            {categories.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-4xl mb-4">🔐</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Control Categories</h2>
                    <p className="text-gray-500 mb-4">Create your first category to start adding security controls.</p>
                    <button
                        onClick={() => {
                            setCategoryForm({ name: '', description: '', icon: '🔒', banner_image: '' });
                            setEditingCategory(null);
                            setShowCategoryModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Create Category
                    </button>
                </div>
            ) : (
                <DragDropContext onDragEnd={handleCategoryDragEnd}>
                    <Droppable droppableId="categories" type="CATEGORY">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                {categories.map((category, index) => {
                                    const categoryControls = controls
                                        .filter((c) => c.category_id === category.id)
                                        .sort((a, b) => a.sort_order - b.sort_order);

                                    return (
                                        <Draggable key={category.id} draggableId={category.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`bg-white border rounded-lg overflow-hidden ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : 'border-gray-200'
                                                        }`}
                                                >
                                                    {/* Category Header */}
                                                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                {...provided.dragHandleProps}
                                                                className="cursor-grab p-1 text-gray-400 hover:text-gray-600"
                                                            >
                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                                                                </svg>
                                                            </div>
                                                            <span className="text-2xl">{category.icon || '🔒'}</span>
                                                            <div>
                                                                <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                                                                {category.description && (
                                                                    <p className="text-sm text-gray-500">{category.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setControlForm({ title: '', description: '', category_id: category.id });
                                                                    setEditingControl(null);
                                                                    setShowControlModal(true);
                                                                }}
                                                                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                </svg>
                                                                Add Control
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setCategoryForm({
                                                                        name: category.name,
                                                                        description: category.description || '',
                                                                        icon: category.icon || '🔒',
                                                                        banner_image: '',
                                                                    });
                                                                    setEditingCategory(category);
                                                                    setShowCategoryModal(true);
                                                                }}
                                                                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm({ type: 'category', id: category.id, label: category.name })}
                                                                className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Controls List with Drag-Drop */}
                                                    <DragDropContext onDragEnd={(result) => handleControlDragEnd(category.id, result)}>
                                                        <Droppable droppableId={`controls-${category.id}`} type="CONTROL">
                                                            {(provided) => (
                                                                <div
                                                                    {...provided.droppableProps}
                                                                    ref={provided.innerRef}
                                                                    className="divide-y divide-gray-100"
                                                                >
                                                                    {categoryControls.length === 0 ? (
                                                                        <div className="px-4 py-8 text-center text-gray-500">
                                                                            No controls in this category. Click "Add Control" to create one.
                                                                        </div>
                                                                    ) : (
                                                                        categoryControls.map((control, controlIndex) => (
                                                                            <Draggable
                                                                                key={control.id}
                                                                                draggableId={control.id}
                                                                                index={controlIndex}
                                                                            >
                                                                                {(provided, snapshot) => (
                                                                                    <div
                                                                                        ref={provided.innerRef}
                                                                                        {...provided.draggableProps}
                                                                                        className={`px-4 py-3 flex items-center gap-3 ${snapshot.isDragging ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                                                            }`}
                                                                                    >
                                                                                        <div
                                                                                            {...provided.dragHandleProps}
                                                                                            className="cursor-grab p-1 text-gray-400 hover:text-gray-600"
                                                                                        >
                                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                                                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="font-medium text-gray-900">{control.title}</p>
                                                                                            {control.description && (
                                                                                                <p className="text-sm text-gray-500 truncate">{control.description}</p>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    setControlForm({
                                                                                                        title: control.title,
                                                                                                        description: control.description || '',
                                                                                                        category_id: control.category_id,
                                                                                                    });
                                                                                                    setEditingControl(control);
                                                                                                    setShowControlModal(true);
                                                                                                }}
                                                                                                className="text-sm text-gray-500 hover:text-gray-700"
                                                                                            >
                                                                                                Edit
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    e.preventDefault();
                                                                                                    setDeleteConfirm({ type: 'control', id: control.id, label: control.title });
                                                                                                }}
                                                                                                className="text-sm text-red-500 hover:text-red-700"
                                                                                            >
                                                                                                Delete
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </Draggable>
                                                                        ))
                                                                    )}
                                                                    {provided.placeholder}
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                    </DragDropContext>
                                                </div>
                                            )
                                            }
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )
            }

            {/* Category Modal */}
            {
                showCategoryModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingCategory ? 'Edit Category' : 'Add Category'}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                                    <div className="flex flex-wrap gap-2">
                                        {EMOJI_OPTIONS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setCategoryForm({ ...categoryForm, icon: emoji })}
                                                className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${categoryForm.icon === emoji
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Access Management"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={categoryForm.description}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="Describe this category..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowCategoryModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveCategory}
                                    disabled={!categoryForm.name}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {editingCategory ? 'Save Changes' : 'Create Category'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Control Modal */}
            {
                showControlModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingControl ? 'Edit Control' : 'Add Control'}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={controlForm.title}
                                        onChange={(e) => setControlForm({ ...controlForm, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., SOC 2 Type II Report"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={controlForm.description}
                                        onChange={(e) => setControlForm({ ...controlForm, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={4}
                                        placeholder="Describe this security control in detail..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowControlModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveControl}
                                    disabled={!controlForm.title}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {editingControl ? 'Save Changes' : 'Add Control'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
