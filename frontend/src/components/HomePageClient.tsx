'use client';

import StatsCounter from '@/components/StatsCounter';
import CertBadgeStrip from '@/components/CertBadgeStrip';
import ComplianceTimeline from '@/components/ComplianceTimeline';
import SectionNav from '@/components/SectionNav';
import Link from 'next/link';

interface HomePageClientProps {
    settings: any;
    publishedDocs: any[];
    categories: any[];
    certifications: any[];
    controlCategories: any[];
    securityUpdates: any[];
    controls: any[];
}

// File type badge helper
function getFileBadge(fileType: string) {
    if (fileType?.includes('pdf')) return { label: 'PDF', className: 'file-badge file-badge-pdf' };
    if (fileType?.includes('word') || fileType?.includes('doc')) return { label: 'DOCX', className: 'file-badge file-badge-doc' };
    if (fileType?.includes('excel') || fileType?.includes('sheet')) return { label: 'XLSX', className: 'file-badge file-badge-xls' };
    return { label: 'FILE', className: 'file-badge file-badge-default' };
}

// Category icons mapping
const categoryIcons: { [key: string]: string } = {
    'compliance': '📋',
    'security': '🔒',
    'privacy': '🛡️',
    'legal': '📜',
    'soc': '✅',
    'iso': '🏆',
    'gdpr': '🇪🇺',
    'hipaa': '🏥',
    'default': '📄',
};

function getCategoryIcon(categoryName: string): string {
    const lowerName = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(categoryIcons)) {
        if (lowerName.includes(key)) return icon;
    }
    return categoryIcons.default;
}

// Severity color helper
const getSeverityColor = (severity?: string) => {
    switch (severity) {
        case 'critical': return 'bg-red-100 text-red-700';
        case 'high': return 'bg-orange-100 text-orange-700';
        case 'medium': return 'bg-yellow-100 text-yellow-700';
        case 'low': return 'bg-blue-100 text-blue-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

// Section nav configuration
const sectionNavItems = [
    {
        id: 'section-overview',
        label: 'Overview',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        id: 'section-documents',
        label: 'Documents',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        id: 'section-controls',
        label: 'Controls',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
    },
    {
        id: 'section-certifications',
        label: 'Certifications',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
        ),
    },
    {
        id: 'section-updates',
        label: 'Updates',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
    },
];

export default function HomePageClient({
    settings,
    publishedDocs,
    categories,
    certifications,
    controlCategories,
    securityUpdates,
    controls,
}: HomePageClientProps) {
    const getUpdatePreview = (content: unknown) => {
        if (typeof content !== 'string') return 'No update details provided.';
        const plain = content.replace(/<[^>]*>/g, '').trim();
        if (!plain) return 'No update details provided.';
        return `${plain.substring(0, 100)}${plain.length > 100 ? '...' : ''}`;
    };

    const statsData = [
        {
            value: certifications.length,
            label: 'Certifications',
            suffix: '',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            ),
        },
        {
            value: publishedDocs.length,
            label: 'Documents',
            suffix: '',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        },
        {
            value: '24/7' as string,
            label: 'Monitoring',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ),
        },
        {
            value: '99.9' as string,
            label: 'Uptime',
            suffix: '%',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
        },
    ];

    // Filter sections that exist
    const activeSections = sectionNavItems.filter(section => {
        switch (section.id) {
            case 'section-overview': return true;
            case 'section-documents': return categories.length > 0 || publishedDocs.length > 0;
            case 'section-controls': return controlCategories.length > 0;
            case 'section-certifications': return certifications.length > 0;
            case 'section-updates': return securityUpdates.length > 0;
            default: return true;
        }
    });

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section - Animated Gradient Mesh */}
            <section className="hero-gradient text-white relative" id="section-overview">
                <div className="container mx-auto px-4 py-20 lg:py-28 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Left Column */}
                        <div>
                            {/* Live status badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                                <span className="w-2 h-2 rounded-full bg-green-400 status-pulse" />
                                <span className="text-sm font-medium text-green-300">All Systems Operational</span>
                            </div>

                            <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
                                {settings.hero_title || 'Security & Trust'}
                            </h1>
                            <p className="text-lg lg:text-xl text-gray-300 mb-8 leading-relaxed max-w-lg">
                                {settings.hero_subtitle || 'Learn about our commitment to keeping your data safe and secure'}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    href="/documents"
                                    className="inline-flex items-center px-6 py-3 bg-white rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 hover:shadow-lg hover:shadow-white/10 hover:-translate-y-0.5"
                                    style={{ color: settings.primary_color || '#111827' }}
                                >
                                    Browse Documents
                                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                                <Link
                                    href="/certifications"
                                    className="inline-flex items-center px-6 py-3 border border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                                >
                                    View Certifications
                                </Link>
                            </div>
                        </div>

                        {/* Right Column - Security Updates */}
                        {securityUpdates.length > 0 && (
                            <div className="glass-card-dark p-6 rounded-2xl">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    Recent Security Updates
                                </h3>
                                <div className="space-y-3">
                                    {securityUpdates.slice(0, 3).map((update: any) => (
                                        <Link
                                            key={update.id}
                                            href="/security-updates"
                                            className="block p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 group"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-white group-hover:text-gray-100 truncate text-sm">
                                                        {update.title || 'Untitled security update'}
                                                    </h4>
                                                    <p className="text-gray-400 text-xs mt-1">
                                                        {update.published_at ? new Date(update.published_at).toLocaleDateString() : ''}
                                                    </p>
                                                </div>
                                                {update.severity && (
                                                    <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${update.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                                                        update.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                                                            update.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                'bg-blue-500/20 text-blue-300'
                                                        }`}>
                                                        {update.severity.charAt(0).toUpperCase() + update.severity.slice(1)}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <Link
                                    href="/security-updates"
                                    className="mt-4 inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors"
                                >
                                    View all security updates
                                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Certification Badges Strip */}
            <CertBadgeStrip certifications={certifications} />

            {/* Animated Stats */}
            <StatsCounter stats={statsData} />

            {/* Section Navigation */}
            <div className="mt-8">
                <SectionNav sections={activeSections} />
            </div>

            {/* Document Categories Section */}
            {categories.length > 0 && (
                <section className="py-16 bg-gray-50/50" id="section-documents">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Security Resources</h2>
                            <p className="text-gray-500 max-w-2xl mx-auto">
                                Access our comprehensive library of security and compliance documentation
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.slice(0, 6).map((category: any) => {
                                const docCount = publishedDocs.filter((doc: any) => doc.category_id === category.id).length;
                                return (
                                    <Link
                                        key={category.id}
                                        href={`/documents?category=${category.id}`}
                                        className="group glass-card card-accent p-6"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="text-3xl p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:scale-110 transition-transform duration-300">
                                                {getCategoryIcon(category.name)}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                                                    {category.name}
                                                </h3>
                                                {category.description && (
                                                    <p className="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed">
                                                        {category.description}
                                                    </p>
                                                )}
                                                <div className="inline-flex items-center gap-1.5 text-sm text-gray-400 font-medium">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    {docCount} document{docCount !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                            <svg
                                                className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all mt-1"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                        {categories.length > 6 && (
                            <div className="mt-8 text-center">
                                <Link
                                    href="/documents"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                    View All Categories
                                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Recent Documents Section */}
            {publishedDocs.length > 0 && (
                <section className="py-16">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Recent Documents</h2>
                                <p className="text-gray-500">Latest additions to our documentation library</p>
                            </div>
                            <Link
                                href="/documents"
                                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm group"
                            >
                                View All
                                <svg className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {publishedDocs.slice(0, 6).map((doc: any) => {
                                const badge = getFileBadge(doc.file_type);
                                return (
                                    <div
                                        key={doc.id}
                                        className="glass-card card-accent p-6"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <span className={badge.className}>{badge.label}</span>
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${doc.access_level === 'public'
                                                ? 'text-green-700 bg-green-50 border border-green-200'
                                                : 'text-amber-700 bg-amber-50 border border-amber-200'
                                                }`}>
                                                {doc.access_level === 'public' ? 'Public' : 'Restricted'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
                                        {doc.description && (
                                            <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">{doc.description}</p>
                                        )}
                                        <Link
                                            href={doc.access_level === 'public'
                                                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/documents/${doc.id}/download`
                                                : `/documents/${doc.id}/request`}
                                            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm group"
                                        >
                                            {doc.access_level === 'public' ? 'Download' : 'Request Access'}
                                            <svg className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={doc.access_level === 'public' ? "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" : "M9 5l7 7-7 7"} />
                                            </svg>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Security Controls Section */}
            {controlCategories.length > 0 && (
                <section className="py-16 bg-gray-50/50" id="section-controls">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Controls</h2>
                                <p className="text-gray-500">Our comprehensive security framework protects your data at every level</p>
                            </div>
                            <Link
                                href="/controls"
                                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm group"
                            >
                                View All
                                <svg className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {controlCategories.slice(0, 6).map((category: any) => {
                                const categoryControls = controls.filter((c: any) => c.category_id === category.id);
                                const displayControls = categoryControls.slice(0, 3);
                                const remainingCount = categoryControls.length - 3;

                                return (
                                    <div
                                        key={category.id}
                                        className="glass-card p-6"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {category.name}
                                            </h3>
                                        </div>

                                        <ul className="space-y-3 mb-4">
                                            {displayControls.length > 0 ? (
                                                displayControls.map((control: any) => (
                                                    <li key={control.id} className="flex items-start gap-2.5">
                                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-gray-600 text-sm">{control.title}</span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-gray-400 text-sm italic">Controls coming soon</li>
                                            )}
                                        </ul>

                                        {remainingCount > 0 && (
                                            <Link
                                                href="/controls"
                                                className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium group"
                                            >
                                                View {remainingCount} more
                                                <svg className="ml-1 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Compliance Timeline Section */}
            {certifications.length > 0 && (
                <section className="py-12" id="section-certifications">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-wrap items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">Compliance Journey</h2>
                                <p className="text-gray-500 text-sm">
                                    Our certifications are continuously maintained and renewed
                                </p>
                            </div>
                            <Link
                                href="/certifications"
                                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all text-sm mt-2 sm:mt-0"
                            >
                                View All
                                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                        <ComplianceTimeline certifications={certifications} />
                    </div>
                </section>
            )}

            {/* Security Updates Section */}
            {securityUpdates.length > 0 && (
                <section className="py-16 bg-gray-50/50" id="section-updates">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Updates</h2>
                                <p className="text-gray-500">Latest security advisories and announcements</p>
                            </div>
                            <Link
                                href="/security-updates"
                                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm group"
                            >
                                View All
                                <svg className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {securityUpdates.slice(0, 3).map((update: any) => (
                                <Link
                                    key={update.id}
                                    href="/security-updates"
                                    className="group glass-card p-6"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                        </div>
                                        {update.severity && (
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(update.severity)}`}>
                                                {update.severity.charAt(0).toUpperCase() + update.severity.slice(1)}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {update.title || 'Untitled security update'}
                                    </h3>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                                        {getUpdatePreview(update.content)}
                                    </p>
                                    <div className="text-xs text-gray-400 font-medium">
                                        {update.published_at ? update.published_at.split('T')[0] : ''}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="py-20 hero-gradient text-white relative">
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl lg:text-4xl font-extrabold mb-4 tracking-tight">Ready to learn more?</h2>
                    <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                        Explore our comprehensive security documentation and learn about our commitment to protecting your data.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/documents"
                            className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 hover:shadow-lg hover:shadow-white/10 hover:-translate-y-0.5"
                        >
                            Browse Documents
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <Link
                            href="/certifications"
                            className="inline-flex items-center px-6 py-3 border border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                        >
                            View Certifications
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
