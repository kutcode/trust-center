import { apiRequest } from '@/lib/api';
import Link from 'next/link';

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

async function getControlCategories(): Promise<ControlCategory[]> {
    try {
        return await apiRequest<ControlCategory[]>('/api/control-categories');
    } catch {
        return [];
    }
}

async function getControls(): Promise<Control[]> {
    try {
        return await apiRequest<Control[]>('/api/controls');
    } catch {
        return [];
    }
}

export default async function ControlsPage() {
    const [categories, controls] = await Promise.all([
        getControlCategories(),
        getControls(),
    ]);

    const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Security Controls</h1>
                    <p className="text-lg text-gray-600 mb-12">
                        Our comprehensive security controls ensure your data is protected at every level.
                    </p>

                    {sortedCategories.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No security controls have been added yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {sortedCategories.map((category) => {
                                const categoryControls = controls
                                    .filter((c) => c.category_id === category.id)
                                    .sort((a, b) => a.sort_order - b.sort_order);

                                return (
                                    <div key={category.id} id={category.id} className="scroll-mt-24">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                            {category.icon && <span className="text-2xl">{category.icon}</span>}
                                            {category.name}
                                        </h2>
                                        {category.description && (
                                            <p className="text-gray-600 mb-6">{category.description}</p>
                                        )}

                                        {categoryControls.length === 0 ? (
                                            <p className="text-gray-500 italic">No controls in this category yet.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {categoryControls.map((control) => (
                                                    <div
                                                        key={control.id}
                                                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
                                                    >
                                                        <div className="flex-shrink-0 mt-1">
                                                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">{control.title}</h3>
                                                            {control.description && (
                                                                <p className="text-gray-600 text-sm mt-1">{control.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
