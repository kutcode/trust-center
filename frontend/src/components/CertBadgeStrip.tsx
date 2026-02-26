'use client';

import Link from 'next/link';

interface Certification {
    id: string;
    name: string;
    issuer: string;
    expiry_date?: string;
}

const certIcons: { [key: string]: { icon: string; gradient: string } } = {
    'soc': { icon: '🛡️', gradient: 'from-blue-500 to-blue-600' },
    'iso': { icon: '🏆', gradient: 'from-purple-500 to-purple-600' },
    'hipaa': { icon: '🏥', gradient: 'from-emerald-500 to-emerald-600' },
    'gdpr': { icon: '🇪🇺', gradient: 'from-indigo-500 to-indigo-600' },
    'pci': { icon: '💳', gradient: 'from-orange-500 to-orange-600' },
    'fedramp': { icon: '🏛️', gradient: 'from-red-500 to-red-600' },
    'ccpa': { icon: '🌴', gradient: 'from-yellow-500 to-yellow-600' },
    'default': { icon: '✓', gradient: 'from-gray-500 to-gray-600' },
};

function getCertStyle(name?: string | null) {
    const lower = (name || '').toLowerCase();
    for (const [key, style] of Object.entries(certIcons)) {
        if (lower.includes(key)) return style;
    }
    return certIcons.default;
}

export default function CertBadgeStrip({ certifications }: { certifications: Certification[] }) {
    if (certifications.length === 0) return null;

    const needsMarquee = certifications.length > 4;

    // Double the items for seamless marquee loop
    const displayCerts = needsMarquee ? [...certifications, ...certifications] : certifications;

    return (
        <section className="bg-gray-50 border-y border-gray-100 py-5 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 status-pulse"></div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Active Certifications
                    </span>
                </div>
            </div>
            <div className="relative">
                <div className={`flex gap-4 px-4 ${needsMarquee ? 'animate-marquee' : 'container mx-auto justify-center flex-wrap'}`}>
                    {displayCerts.map((cert, i) => {
                        const style = getCertStyle(cert.name);
                        const isValid = !cert.expiry_date || new Date(cert.expiry_date) > new Date();
                        return (
                            <Link
                                key={`${cert.id}-${i}`}
                                href="/certifications"
                                className="flex-shrink-0 group"
                            >
                                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                                    <span className="text-lg">{style.icon}</span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap group-hover:text-blue-600 transition-colors">
                                            {cert.name || 'Untitled Certification'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {cert.issuer || 'Unknown issuer'}
                                        </span>
                                    </div>
                                    {isValid && (
                                        <div className="ml-1 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
