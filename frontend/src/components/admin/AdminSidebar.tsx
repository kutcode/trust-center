'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client';
import { useSidebar } from '@/contexts/SidebarContext';
import toast from 'react-hot-toast';

interface NavItem {
    key: string;
    href: string;
    label: string;
    icon: React.ReactNode;
}

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
const WARNING_TIME_MS = 60 * 1000; // Show warning 1 minute before logout

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<{ email: string; full_name?: string } | null>(null);
    const { collapsed, toggleCollapsed } = useSidebar();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
    const [navOrder, setNavOrder] = useState<string[]>([]);

    useEffect(() => {
        async function loadUserAndSettings() {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                const { data: adminUser } = await supabase
                    .from('admin_users')
                    .select('email, full_name')
                    .eq('id', session.user.id)
                    .single();

                if (adminUser) {
                    setUser(adminUser);
                }

                // Load nav order from settings
                const { data: settings } = await supabase
                    .from('trust_center_settings')
                    .select('admin_nav_order')
                    .limit(1)
                    .single();

                if (settings?.admin_nav_order && settings.admin_nav_order.length > 0) {
                    setNavOrder(settings.admin_nav_order);
                }
            }
        }
        loadUserAndSettings();
    }, []);

    const handleLogout = useCallback(async (reason?: string, isAutoLogout: boolean = false) => {
        const supabase = createClient();

        // Get auth token for logging request
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            try {
                // Call backend to log the logout action
                const endpoint = isAutoLogout ? '/api/auth/logout/auto' : '/api/auth/logout';
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                });
            } catch (e) {
                // Don't block logout if logging fails
                console.error('Failed to log logout:', e);
            }
        }

        await supabase.auth.signOut();
        if (reason) {
            toast.error(reason);
        }
        router.push('/admin/login');
    }, [router]);

    // Track user activity
    const updateActivity = useCallback(() => {
        setLastActivity(Date.now());
        setShowTimeoutWarning(false);
    }, []);

    // Set up activity listeners
    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            document.addEventListener(event, updateActivity);
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, updateActivity);
            });
        };
    }, [updateActivity]);

    // Check for idle timeout
    useEffect(() => {
        const checkIdleTimeout = setInterval(() => {
            const idleTime = Date.now() - lastActivity;

            // Show warning 1 minute before logout
            if (idleTime >= IDLE_TIMEOUT_MS - WARNING_TIME_MS && !showTimeoutWarning) {
                setShowTimeoutWarning(true);
                toast.error('You will be logged out in 1 minute due to inactivity. Move your mouse or click to stay logged in.', {
                    duration: 10000,
                    id: 'idle-warning',
                });
            }

            // Auto-logout after 10 minutes of inactivity
            if (idleTime >= IDLE_TIMEOUT_MS) {
                handleLogout('Session expired due to inactivity. Please log in again.', true);
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(checkIdleTimeout);
    }, [lastActivity, showTimeoutWarning, handleLogout]);

    const navItemsBase: NavItem[] = [
        {
            key: 'dashboard',
            href: '/admin',
            label: 'Dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            key: 'controls',
            href: '/admin/controls',
            label: 'Security Controls',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
        },
        {
            key: 'documents',
            href: '/admin/documents',
            label: 'Documents',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        },
        {
            key: 'certifications',
            href: '/admin/certifications',
            label: 'Certifications',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            ),
        },
        {
            key: 'security-updates',
            href: '/admin/security-updates',
            label: 'Security Updates',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ),
        },
        {
            key: 'requests',
            href: '/admin/requests',
            label: 'Requests',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
        },
        {
            key: 'organizations',
            href: '/admin/organizations',
            label: 'Organizations',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
        },
        {
            key: 'users',
            href: '/admin/users',
            label: 'Users',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            key: 'activity',
            href: '/admin/activity',
            label: 'Activity Logs',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
        },
        {
            key: 'settings',
            href: '/admin/settings',
            label: 'Settings',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
    ];

    // Sort nav items based on custom order from settings
    const navItems = useMemo(() => {
        if (navOrder.length === 0) {
            return navItemsBase;
        }

        // Create a map for quick lookup
        const itemMap = new Map(navItemsBase.map(item => [item.key, item]));

        // Build sorted array based on navOrder
        const sorted: NavItem[] = [];
        for (const key of navOrder) {
            const item = itemMap.get(key);
            if (item) {
                sorted.push(item);
                itemMap.delete(key);
            }
        }

        // Add any remaining items not in navOrder (in case of new items)
        for (const item of itemMap.values()) {
            sorted.push(item);
        }

        return sorted;
    }, [navOrder]);

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    return (
        <aside
            className={`fixed left-0 ${isDemoMode ? 'top-9' : 'top-0'} ${isDemoMode ? 'h-[calc(100%-2.25rem)]' : 'h-full'} bg-slate-900 text-white transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Logo & Collapse Button */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
                {!collapsed && (
                    <span className="text-lg font-bold text-white">Admin</span>
                )}
                <button
                    onClick={toggleCollapsed}
                    className={`p-2 rounded-lg hover:bg-slate-700 transition-colors ${collapsed ? 'mx-auto' : ''}`}
                    title={collapsed ? 'Expand' : 'Collapse'}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {collapsed ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive(item.href)
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    } ${collapsed ? 'justify-center' : ''}`}
                                title={collapsed ? item.label : undefined}
                            >
                                {item.icon}
                                {!collapsed && <span className="font-medium">{item.label}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Divider */}
            <div className="border-t border-slate-700 mx-4" />

            {/* View Site Link */}
            <div className="px-2 py-2">
                <Link
                    href="/"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''
                        }`}
                    title="View Site"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {!collapsed && <span className="font-medium">View Site</span>}
                </Link>

                {/* Sign Out Button - Always Visible */}
                <button
                    onClick={() => handleLogout()}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors ${collapsed ? 'justify-center' : ''
                        }`}
                    title="Sign Out"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!collapsed && <span className="font-medium">Sign Out</span>}
                </button>
            </div>

            {/* User Info */}
            <div className="border-t border-slate-700 p-3">
                <div className={`flex items-center gap-3 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-white">
                            {user?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                        </span>
                    </div>
                    {!collapsed && (
                        <div className="flex-1 text-left overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.full_name || 'Admin'}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
