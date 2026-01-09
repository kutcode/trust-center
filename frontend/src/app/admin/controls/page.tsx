'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import toast from 'react-hot-toast';

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

export default function AdminControlsPage() {
    const [categories, setCategories] = useState<ControlCategory[]>([]);
    const [controls, setControls] = useState<Control[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showControlModal, setShowControlModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ControlCategory | null>(null);
    const [editingControl, setEditingControl] = useState<Control | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '' });
    const [controlForm, setControlForm] = useState({ title: '', description: '', category_id: '' });

    useEffect(() => {
        loadData();
    }, []);

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
                setCategories(cats);
                setControls(ctrls);
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        }
        setLoading(false);
    }

    async function saveCategory() {
        if (!token) return;
        try {
            if (editingCategory) {
                await apiRequestWithAuth(`/api/admin/control-categories/${editingCategory.id}`, token, {
                    method: 'PATCH',
                    body: JSON.stringify(categoryForm),
                });
                toast.success('Category updated');
            } else {
                await apiRequestWithAuth('/api/admin/control-categories', token, {
                    method: 'POST',
                    body: JSON.stringify(categoryForm),
                });
                toast.success('Category created');
            }
            setShowCategoryModal(false);
            setCategoryForm({ name: '', description: '', icon: '' });
            setEditingCategory(null);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save category');
        }
    }

    async function deleteCategory(id: string) {
        if (!token || !confirm('Delete this category? All controls in it will also be deleted.')) return;
        try {
            await apiRequestWithAuth(`/api/admin/control-categories/${id}`, token, { method: 'DELETE' });
            toast.success('Category deleted');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete category');
        }
    }

    async function saveControl() {
        if (!token) return;
        try {
            if (editingControl) {
                await apiRequestWithAuth(`/api/admin/controls/${editingControl.id}`, token, {
                    method: 'PATCH',
                    body: JSON.stringify(controlForm),
                });
                toast.success('Control updated');
            } else {
                await apiRequestWithAuth('/api/admin/controls', token, {
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
        if (!token || !confirm('Delete this control?')) return;
        try {
            await apiRequestWithAuth(`/api/admin/controls/${id}`, token, { method: 'DELETE' });
            toast.success('Control deleted');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete control');
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Security Controls</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage security control categories and items</p>
                </div>
                <button
                    onClick={() => {
                        setCategoryForm({ name: '', description: '', icon: '' });
                        setEditingCategory(null);
                        setShowCategoryModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Add Category
                </button>
            </div>

            {categories.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No control categories yet. Create one to get started.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {categories.map((category) => {
                        const categoryControls = controls.filter((c) => c.category_id === category.id);
                        return (
                            <div key={category.id} className="bg-white border border-gray-200 rounded-lg">
                                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {category.icon && <span className="text-2xl">{category.icon}</span>}
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
                                            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                            Add Control
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCategoryForm({ name: category.name, description: category.description || '', icon: category.icon || '' });
                                                setEditingCategory(category);
                                                setShowCategoryModal(true);
                                            }}
                                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteCategory(category.id)}
                                            className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    {categoryControls.length === 0 ? (
                                        <p className="text-gray-500 text-sm italic">No controls in this category</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {categoryControls.map((control) => (
                                                <div key={control.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{control.title}</p>
                                                            {control.description && (
                                                                <p className="text-sm text-gray-500">{control.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setControlForm({ title: control.title, description: control.description || '', category_id: control.category_id });
                                                                setEditingControl(control);
                                                                setShowControlModal(true);
                                                            }}
                                                            className="text-gray-500 hover:text-gray-700"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deleteControl(control.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
                                <input
                                    type="text"
                                    value={categoryForm.icon}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="🔒"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                            <button onClick={saveCategory} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Control Modal */}
            {showControlModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">{editingControl ? 'Edit Control' : 'Add Control'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={controlForm.title}
                                    onChange={(e) => setControlForm({ ...controlForm, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={controlForm.description}
                                    onChange={(e) => setControlForm({ ...controlForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowControlModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                            <button onClick={saveControl} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
