'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import FormField from '@/components/ui/FormField';
import { useFormValidation } from '@/hooks/useFormValidation';

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
    control_framework_mappings?: ControlFrameworkMapping[];
}

interface Framework {
    id: string;
    name: string;
    description?: string;
    version?: string;
    url?: string;
    icon?: string;
    sort_order: number;
}

interface ControlFrameworkMapping {
    id: string;
    control_id: string;
    framework_id: string;
    reference_code?: string;
    frameworks?: Framework;
}

const EMOJI_OPTIONS = ['🔒', '🛡️', '👥', '🔑', '📋', '🖥️', '☁️', '📡', '🔍', '📊', '⚡', '🏢', '🔐', '📱', '🌐'];

export default function AdminControlsPage() {
    const [categories, setCategories] = useState<ControlCategory[]>([]);
    const [controls, setControls] = useState<Control[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    const [frameworks, setFrameworks] = useState<Framework[]>([]);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showControlModal, setShowControlModal] = useState(false);
    const [showFrameworkModal, setShowFrameworkModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ControlCategory | null>(null);
    const [editingControl, setEditingControl] = useState<Control | null>(null);
    const [editingFramework, setEditingFramework] = useState<Framework | null>(null);

    const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '🔒', banner_image: '' });
    const [controlForm, setControlForm] = useState({ title: '', description: '', category_id: '' });
    const [frameworkForm, setFrameworkForm] = useState({ name: '', description: '', version: '', url: '', icon: '' });
    const [controlMappings, setControlMappings] = useState<{ framework_id: string; reference_code: string }[]>([]);
    const [showFrameworksManager, setShowFrameworksManager] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<
        | { type: 'category'; id: string; label: string }
        | { type: 'control'; id: string; label: string }
        | { type: 'framework'; id: string; label: string }
        | null
    >(null);
    const [deleting, setDeleting] = useState(false);
    const {
        errors: categoryErrors,
        validateAll: validateCategoryForm,
        clearFieldError: clearCategoryFieldError,
        clearErrors: clearCategoryErrors,
    } = useFormValidation<typeof categoryForm>({
        name: (value) => (value.trim() ? null : 'Category name is required'),
    });
    const {
        errors: controlErrors,
        validateAll: validateControlForm,
        clearFieldError: clearControlFieldError,
        clearErrors: clearControlErrors,
    } = useFormValidation<typeof controlForm>({
        title: (value) => (value.trim() ? null : 'Control title is required'),
        category_id: (value) => (value ? null : 'Category is required'),
    });

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
                const [cats, ctrls, fws] = await Promise.all([
                    apiRequestWithAuth<ControlCategory[]>('/api/admin/control-categories', session.access_token),
                    apiRequestWithAuth<Control[]>('/api/admin/controls', session.access_token),
                    apiRequestWithAuth<Framework[]>('/api/admin/frameworks', session.access_token),
                ]);
                setCategories([...cats].sort((a, b) => a.sort_order - b.sort_order));
                setControls(ctrls);
                setFrameworks(fws);
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
            if (!validateCategoryForm(categoryForm)) {
                toast.error('Please fix the category form errors');
                return;
            }
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
            clearCategoryErrors();
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
            if (!validateControlForm(controlForm)) {
                toast.error('Please fix the control form errors');
                return;
            }
            const freshToken = await getToken();
            if (!freshToken) throw new Error('Not authenticated');
            let controlId: string;
            if (editingControl) {
                await apiRequestWithAuth(`/api/admin/controls/${editingControl.id}`, freshToken, {
                    method: 'PATCH',
                    body: JSON.stringify(controlForm),
                });
                controlId = editingControl.id;
                toast.success('Control updated');
            } else {
                const created = await apiRequestWithAuth<any>('/api/admin/controls', freshToken, {
                    method: 'POST',
                    body: JSON.stringify(controlForm),
                });
                controlId = created.id;
                toast.success('Control created');
            }
            // Save framework mappings
            await apiRequestWithAuth(`/api/admin/controls/${controlId}/frameworks`, freshToken, {
                method: 'PUT',
                body: JSON.stringify({ mappings: controlMappings }),
            });
            setShowControlModal(false);
            setControlForm({ title: '', description: '', category_id: '' });
            setControlMappings([]);
            setEditingControl(null);
            clearControlErrors();
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

    // Framework CRUD
    async function saveFramework() {
        try {
            if (!frameworkForm.name.trim()) {
                toast.error('Framework name is required');
                return;
            }
            const freshToken = await getToken();
            if (!freshToken) throw new Error('Not authenticated');
            if (editingFramework) {
                await apiRequestWithAuth(`/api/admin/frameworks/${editingFramework.id}`, freshToken, {
                    method: 'PATCH',
                    body: JSON.stringify(frameworkForm),
                });
                toast.success('Framework updated');
            } else {
                await apiRequestWithAuth('/api/admin/frameworks', freshToken, {
                    method: 'POST',
                    body: JSON.stringify(frameworkForm),
                });
                toast.success('Framework created');
            }
            setShowFrameworkModal(false);
            setFrameworkForm({ name: '', description: '', version: '', url: '', icon: '' });
            setEditingFramework(null);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save framework');
        }
    }

    async function deleteFramework(id: string) {
        try {
            setDeleting(true);
            const freshToken = await getToken();
            if (!freshToken) throw new Error('Not authenticated');
            await apiRequestWithAuth(`/api/admin/frameworks/${id}`, freshToken, { method: 'DELETE' });
            toast.success('Framework deleted');
            setDeleteConfirm(null);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete framework');
        } finally {
            setDeleting(false);
        }
    }

    function addMappingRow() {
        setControlMappings([...controlMappings, { framework_id: '', reference_code: '' }]);
    }

    function removeMappingRow(index: number) {
        setControlMappings(controlMappings.filter((_, i) => i !== index));
    }

    function updateMappingRow(index: number, field: 'framework_id' | 'reference_code', value: string) {
        const updated = [...controlMappings];
        updated[index] = { ...updated[index], [field]: value };
        setControlMappings(updated);
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
                    } else if (deleteConfirm.type === 'framework') {
                        void deleteFramework(deleteConfirm.id);
                    } else {
                        void deleteControl(deleteConfirm.id);
                    }
                }}
                title={deleteConfirm?.type === 'category' ? 'Delete Category' : deleteConfirm?.type === 'framework' ? 'Delete Framework' : 'Delete Control'}
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFrameworksManager(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Manage Frameworks ({frameworks.length})
                    </button>
                    <button
                        onClick={() => {
                            setCategoryForm({ name: '', description: '', icon: '🔒', banner_image: '' });
                            setEditingCategory(null);
                            clearCategoryErrors();
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
                            clearCategoryErrors();
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
                                                                    clearCategoryErrors();
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
                                                                                                    // Load existing mappings
                                                                                                    const existingMappings = (control.control_framework_mappings || []).map(m => ({
                                                                                                        framework_id: m.framework_id,
                                                                                                        reference_code: m.reference_code || '',
                                                                                                    }));
                                                                                                    setControlMappings(existingMappings);
                                                                                                    setEditingControl(control);
                                                                                                    clearControlErrors();
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
                                <FormField label="Name" required error={categoryErrors.name}>
                                    <input
                                        type="text"
                                        value={categoryForm.name}
                                        onChange={(e) => {
                                            setCategoryForm({ ...categoryForm, name: e.target.value });
                                            clearCategoryFieldError('name');
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Access Management"
                                    />
                                </FormField>
                                <FormField label="Description">
                                    <textarea
                                        value={categoryForm.description}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="Describe this category..."
                                    />
                                </FormField>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        clearCategoryErrors();
                                        setShowCategoryModal(false);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveCategory}
                                    disabled={!categoryForm.name.trim()}
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
            {showControlModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingControl ? 'Edit Control' : 'Add Control'}
                        </h3>
                        <div className="space-y-4">
                            <FormField label="Title" required error={controlErrors.title}>
                                <input
                                    type="text"
                                    value={controlForm.title}
                                    onChange={(e) => {
                                        setControlForm({ ...controlForm, title: e.target.value });
                                        clearControlFieldError('title');
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., SOC 2 Type II Report"
                                />
                            </FormField>
                            <FormField label="Description">
                                <textarea
                                    value={controlForm.description}
                                    onChange={(e) => setControlForm({ ...controlForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={4}
                                    placeholder="Describe this security control in detail..."
                                />
                            </FormField>

                            {/* Framework Mappings */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Framework Mappings</label>
                                    <button
                                        type="button"
                                        onClick={addMappingRow}
                                        disabled={frameworks.length === 0}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
                                    >
                                        + Add Framework
                                    </button>
                                </div>
                                {frameworks.length === 0 && (
                                    <p className="text-sm text-gray-400 italic">No frameworks created yet. Use "Manage Frameworks" to create some first.</p>
                                )}
                                {controlMappings.length > 0 && (
                                    <div className="space-y-2">
                                        {controlMappings.map((mapping, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <select
                                                    value={mapping.framework_id}
                                                    onChange={(e) => updateMappingRow(idx, 'framework_id', e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="">Select framework...</option>
                                                    {frameworks.map(fw => (
                                                        <option key={fw.id} value={fw.id}>{fw.name}{fw.version ? ` (${fw.version})` : ''}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="text"
                                                    value={mapping.reference_code}
                                                    onChange={(e) => updateMappingRow(idx, 'reference_code', e.target.value)}
                                                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="e.g. CC6.1"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeMappingRow(idx)}
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    clearControlErrors();
                                    setControlMappings([]);
                                    setShowControlModal(false);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveControl}
                                disabled={!controlForm.title.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {editingControl ? 'Save Changes' : 'Add Control'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Frameworks Manager Modal */}
            {showFrameworksManager && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Manage Frameworks</h3>
                            <button
                                onClick={() => {
                                    setFrameworkForm({ name: '', description: '', version: '', url: '', icon: '' });
                                    setEditingFramework(null);
                                    setShowFrameworkModal(true);
                                }}
                                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Framework
                            </button>
                        </div>
                        {frameworks.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No frameworks yet. Add SOC 2, ISO 27001, NIST, etc.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {frameworks.map(fw => (
                                    <div key={fw.id} className="py-3 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {fw.icon && <span className="text-lg">{fw.icon}</span>}
                                                <span className="font-medium text-gray-900">{fw.name}</span>
                                                {fw.version && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{fw.version}</span>}
                                            </div>
                                            {fw.description && <p className="text-sm text-gray-500 mt-0.5">{fw.description}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setFrameworkForm({
                                                        name: fw.name,
                                                        description: fw.description || '',
                                                        version: fw.version || '',
                                                        url: fw.url || '',
                                                        icon: fw.icon || '',
                                                    });
                                                    setEditingFramework(fw);
                                                    setShowFrameworkModal(true);
                                                }}
                                                className="text-sm text-gray-500 hover:text-gray-700"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm({ type: 'framework', id: fw.id, label: fw.name })}
                                                className="text-sm text-red-500 hover:text-red-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowFrameworksManager(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Framework Create/Edit Modal */}
            {showFrameworkModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingFramework ? 'Edit Framework' : 'Add Framework'}
                        </h3>
                        <div className="space-y-4">
                            <FormField label="Name" required>
                                <input
                                    type="text"
                                    value={frameworkForm.name}
                                    onChange={(e) => setFrameworkForm({ ...frameworkForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., SOC 2 Type II"
                                />
                            </FormField>
                            <FormField label="Version">
                                <input
                                    type="text"
                                    value={frameworkForm.version}
                                    onChange={(e) => setFrameworkForm({ ...frameworkForm, version: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 2024"
                                />
                            </FormField>
                            <FormField label="Description">
                                <textarea
                                    value={frameworkForm.description}
                                    onChange={(e) => setFrameworkForm({ ...frameworkForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={2}
                                    placeholder="Brief description..."
                                />
                            </FormField>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Icon (emoji)">
                                    <input
                                        type="text"
                                        value={frameworkForm.icon}
                                        onChange={(e) => setFrameworkForm({ ...frameworkForm, icon: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="🛡️"
                                    />
                                </FormField>
                                <FormField label="URL">
                                    <input
                                        type="text"
                                        value={frameworkForm.url}
                                        onChange={(e) => setFrameworkForm({ ...frameworkForm, url: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://..."
                                    />
                                </FormField>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowFrameworkModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveFramework}
                                disabled={!frameworkForm.name.trim()}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {editingFramework ? 'Save Changes' : 'Create Framework'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
