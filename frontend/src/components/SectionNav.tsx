'use client';

import { useState, useEffect, useRef } from 'react';

interface SectionNavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface SectionNavProps {
    sections: SectionNavItem[];
}

export default function SectionNav({ sections }: SectionNavProps) {
    const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
    const [isSticky, setIsSticky] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // IntersectionObserver for sticky detection
        const stickyObserver = new IntersectionObserver(
            ([entry]) => {
                setIsSticky(!entry.isIntersecting);
            },
            { threshold: 0 }
        );

        if (sentinelRef.current) {
            stickyObserver.observe(sentinelRef.current);
        }

        // IntersectionObserver for active section tracking
        const sectionObserver = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                }
            },
            { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
        );

        sections.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) sectionObserver.observe(el);
        });

        return () => {
            stickyObserver.disconnect();
            sectionObserver.disconnect();
        };
    }, [sections]);

    const handleClick = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <>
            {/* Sentinel for sticky detection */}
            <div ref={sentinelRef} className="h-0" />
            <div
                ref={navRef}
                className={`sticky top-[57px] z-30 transition-all duration-300 ${isSticky
                        ? 'bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-200/80'
                        : 'bg-transparent'
                    }`}
            >
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => handleClick(section.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeSection === section.id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`transition-colors ${activeSection === section.id ? 'text-blue-500' : 'text-gray-400'}`}>
                                    {section.icon}
                                </span>
                                <span className="hidden sm:inline">{section.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        </>
    );
}
