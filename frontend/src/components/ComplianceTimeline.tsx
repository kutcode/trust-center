'use client';

import { useRef } from 'react';

interface CertMilestone {
    id: string;
    name: string;
    issuer: string;
    issue_date?: string;
    expiry_date?: string;
}

export default function ComplianceTimeline({ certifications }: { certifications: CertMilestone[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Always order oldest (left) → newest (right) by issue_date; certs without issue_date go to the end
    const sorted = [...certifications]
        .sort((a, b) => {
            const dateA = a.issue_date ? new Date(a.issue_date).getTime() : Infinity;
            const dateB = b.issue_date ? new Date(b.issue_date).getTime() : Infinity;
            return dateA - dateB;
        });

    if (sorted.length === 0) return null;

    const getStatus = (expiryDate?: string) => {
        if (!expiryDate) return { label: 'Active', dotColor: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' };
        const daysLeft = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
        if (daysLeft < 0) return { label: 'Expired', dotColor: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' };
        if (daysLeft <= 60) return { label: 'Renewing', dotColor: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' };
        return { label: 'Active', dotColor: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' };
    };

    const scroll = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
    };

    return (
        <div className="relative group/timeline">
            {/* Scroll buttons */}
            <button
                onClick={() => scroll('left')}
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-lg transition-all hidden md:flex opacity-0 group-hover/timeline:opacity-100"
                aria-label="Scroll left"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button
                onClick={() => scroll('right')}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-lg transition-all hidden md:flex opacity-0 group-hover/timeline:opacity-100"
                aria-label="Scroll right"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* Scrollable area */}
            <div
                ref={scrollRef}
                className="overflow-x-auto pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
                <div className="relative" style={{ minWidth: `${sorted.length * 244}px` }}>
                    {/* Single continuous horizontal line */}
                    <div
                        className="absolute left-[130px] right-[130px] top-[18px] h-[2px]"
                        style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)' }}
                    />

                    {/* Cards row */}
                    <div className="flex">
                        {sorted.map((cert) => {
                            const status = getStatus(cert.expiry_date);
                            return (
                                <div key={cert.id} className="flex-shrink-0 flex flex-col items-center" style={{ width: '244px' }}>
                                    {/* Dot */}
                                    <div
                                        className="relative z-10 w-[14px] h-[14px] rounded-full border-[3px] border-white mb-3"
                                        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 0 3px rgba(59,130,246,0.2)' }}
                                    />

                                    {/* Card */}
                                    <div className="w-[220px] bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md hover:border-gray-300 transition-all">
                                        <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate" title={cert.name}>{cert.name}</h4>
                                        <p className="text-xs text-gray-400 mb-2.5 truncate">{cert.issuer}</p>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${status.textColor} ${status.bgColor}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor} ${status.label === 'Active' ? 'status-pulse' : ''}`} />
                                            {status.label}
                                        </span>
                                        <div className="flex justify-center gap-3 mt-2 text-[11px] text-gray-400">
                                            {cert.issue_date && (
                                                <span>{new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                            )}
                                            {cert.expiry_date && (
                                                <span className="text-gray-300">→</span>
                                            )}
                                            {cert.expiry_date && (
                                                <span>{new Date(cert.expiry_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
