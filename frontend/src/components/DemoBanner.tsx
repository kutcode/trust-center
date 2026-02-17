'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default function DemoBanner() {
    const pathname = usePathname();

    if (!isDemoMode) return null;

    const isAdmin = pathname?.startsWith('/admin');

    return (
        <>
            <div
                className={`fixed top-0 left-0 right-0 z-[9999] text-center py-2 px-4 text-sm font-medium ${isAdmin
                    ? 'bg-amber-500 text-amber-950'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    }`}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap">
                    <span>🚀 You&apos;re viewing a live demo — data resets every hour</span>
                    <span className="hidden sm:inline text-white/60">|</span>
                    {isAdmin ? (
                        <Link
                            href="/"
                            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                        >
                            View Public Site →
                        </Link>
                    ) : (
                        <Link
                            href="/admin"
                            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                        >
                            Try Admin Panel →
                        </Link>
                    )}
                    <span className="hidden sm:inline text-white/60">|</span>
                    <a
                        href="https://github.com/kutcode/trust-center"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                    >
                        ⭐ GitHub
                    </a>
                </div>
            </div>
            {/* Spacer to prevent content from being hidden behind the fixed banner */}
            <div className="h-9" />
        </>
    );
}
