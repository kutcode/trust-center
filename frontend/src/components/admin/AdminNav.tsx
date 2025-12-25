'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string; full_name?: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
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
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/documents', label: 'Documents' },
    { href: '/admin/requests', label: 'Requests' },
    { href: '/admin/tickets', label: 'Tickets' },
    { href: '/admin/organizations', label: 'Organizations' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/settings', label: 'Settings' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xl font-bold text-gray-900">
              Admin Console
            </Link>
            <div className="hidden md:flex gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden sm:inline text-gray-600 text-sm">{user.email}</span>
            )}
            <Link
              href="/"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

