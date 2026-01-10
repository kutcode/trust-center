'use client';

import { useEffect, useState, useRef } from 'react';
import { apiRequest } from '@/lib/api';
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

export default function ControlsPage() {
    const [categories, setCategories] = useState<ControlCategory[]>([]);
    const [controls, setControls] = useState<Control[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

    useEffect(() => {
        async function loadData() {
            try {
                const [cats, ctrls] = await Promise.all([
                    apiRequest<ControlCategory[]>('/api/control-categories'),
                    apiRequest<Control[]>('/api/controls'),
                ]);
                const sortedCats = [...cats].sort((a, b) => a.sort_order - b.sort_order);
                setCategories(sortedCats);
                setControls(ctrls);
                if (sortedCats.length > 0) {
                    setActiveCategory(sortedCats[0].id);
                }
            } catch (error) {
                console.error('Failed to load controls:', error);
            }
            setLoading(false);
        }
        loadData();
    }, []);

    // Handle hash navigation on page load
    useEffect(() => {
        if (categories.length > 0 && window.location.hash) {
            const hash = window.location.hash.slice(1);
            const element = document.getElementById(hash);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    }, [categories]);

    // Intersection Observer for active category highlighting
    useEffect(() => {
        if (categories.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveCategory(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-20% 0px -70% 0px',
                threshold: 0,
            }
        );

        sectionRefs.current.forEach((element) => {
            observer.observe(element);
        });

        return () => observer.disconnect();
    }, [categories]);

    const scrollToSection = (categoryId: string) => {
        const element = sectionRefs.current.get(categoryId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const getCategoryIcon = (icon?: string) => {
        if (icon) return icon;
        return '🔒';
    };

    const copyToClipboard = async (id: string, type: 'category' | 'control', name: string) => {
        const url = `${window.location.origin}/controls#${id}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(id);
            toast.success(`Link to "${name}" copied!`);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            toast.error('Failed to copy link');
        }
    };

    // Generate a slug from control title for anchor links
    const getControlSlug = (controlId: string, title: string) => {
        return `control-${controlId.slice(0, 8)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold text-gray-900">Security Controls</h1>
                    <p className="text-gray-600 mt-2 max-w-2xl">
                        Our comprehensive security controls ensure your data is protected at every level.
                        These controls demonstrate our commitment to security and compliance.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {categories.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                        <div className="text-4xl mb-4">🔐</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Security Controls Yet</h2>
                        <p className="text-gray-500">Security controls will be displayed here once they are configured.</p>
                    </div>
                ) : (
                    <div className="flex gap-8">
                        {/* Sticky Sidebar */}
                        <aside className="hidden lg:block w-64 flex-shrink-0">
                            <nav className="sticky top-8 space-y-1">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => scrollToSection(category.id)}
                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3 ${activeCategory === category.id
                                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                    >
                                        <span className="text-lg">{getCategoryIcon(category.icon)}</span>
                                        <span className="truncate">{category.name}</span>
                                    </button>
                                ))}
                            </nav>
                        </aside>

                        {/* Main Content Area */}
                        <main className="flex-1 space-y-8">
                            {categories.map((category, catIndex) => {
                                const categoryControls = controls
                                    .filter((c) => c.category_id === category.id)
                                    .sort((a, b) => a.sort_order - b.sort_order);

                                return (
                                    <section
                                        key={category.id}
                                        id={category.id}
                                        ref={(el) => {
                                            if (el) sectionRefs.current.set(category.id, el);
                                        }}
                                        className="scroll-mt-8"
                                    >
                                        {/* Category Header */}
                                        <div
                                            className="rounded-t-xl px-6 py-8 relative overflow-hidden bg-gray-100 text-gray-900"
                                        >
                                            <div className="relative z-10 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-3xl">{getCategoryIcon(category.icon)}</span>
                                                    <div>
                                                        <h2 className="text-2xl font-bold">{category.name}</h2>
                                                        {category.description && (
                                                            <p className="text-base mt-1 text-gray-500">
                                                                {category.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Copy Category Link Button */}
                                                <div className="relative group/tooltip">
                                                    <button
                                                        onClick={() => copyToClipboard(category.id, 'category', category.name)}
                                                        className="p-2 rounded-lg transition-all hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                                                        aria-label="Copy link to this section"
                                                    >
                                                        {copiedId === category.id ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black text-white text-xs rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all whitespace-nowrap z-10 pointer-events-none">
                                                        Copy link to section
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Controls List */}
                                        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 divide-y divide-gray-100">
                                            {categoryControls.length === 0 ? (
                                                <div className="px-6 py-8 text-center text-gray-500">
                                                    No controls in this category yet.
                                                </div>
                                            ) : (
                                                categoryControls.map((control) => {
                                                    const controlSlug = getControlSlug(control.id, control.title);
                                                    return (
                                                        <div
                                                            key={control.id}
                                                            id={controlSlug}
                                                            className="px-6 py-5 flex items-start gap-4 group scroll-mt-8"
                                                        >
                                                            {/* Green Checkmark */}
                                                            <div className="flex-shrink-0 mt-0.5">
                                                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                                                    <svg
                                                                        className="w-4 h-4 text-green-600"
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path
                                                                            fillRule="evenodd"
                                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                            clipRule="evenodd"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            </div>

                                                            {/* Control Content */}
                                                            <div className="flex-1">
                                                                <h3 className="text-base font-semibold text-gray-900">
                                                                    {control.title}
                                                                </h3>
                                                                {control.description && (
                                                                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                                                                        {control.description}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Copy Control Link Button */}
                                                            <div className="relative group/tooltip">
                                                                <button
                                                                    onClick={() => copyToClipboard(controlSlug, 'control', control.title)}
                                                                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                                                    aria-label="Copy link to this control"
                                                                >
                                                                    {copiedId === controlSlug ? (
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    ) : (
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                                <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black text-white text-xs rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all whitespace-nowrap z-10 pointer-events-none">
                                                                    Copy link to section
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </section>
                                );
                            })}
                        </main>
                    </div>
                )}
            </div>
        </div >
    );
}
