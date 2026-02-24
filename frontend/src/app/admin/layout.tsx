'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import Breadcrumbs, { BreadcrumbItem } from '@/components/ui/Breadcrumbs';

function toTitle(segment: string): string {
  if (segment === 'admin') return 'Admin';
  if (segment === 'new') return 'New';
  if (segment === 'integrations') return 'Integrations';
  if (segment === 'security-updates') return 'Security Updates';
  if (segment === 'activity') return 'Activity Logs';
  if (segment === 'users') return 'Users';
  if (segment === 'requests') return 'Requests';
  if (segment === 'documents') return 'Documents';
  if (segment === 'controls') return 'Security Controls';
  if (segment === 'organizations') return 'Organizations';
  if (segment === 'certifications') return 'Certifications';
  if (segment === 'settings') return 'Settings';
  if (/^[0-9a-f-]{8,}$/i.test(segment)) return 'Edit';
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildAdminBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0 || pathname === '/admin' || pathname === '/admin/login') {
    return [];
  }

  const items: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/admin' }];
  let path = '';

  for (const segment of segments) {
    path += `/${segment}`;
    if (segment === 'admin') continue;
    items.push({
      label: toTitle(segment),
      href: path,
    });
  }

  if (items.length > 0) {
    items[items.length - 1] = { label: items[items.length - 1].label };
  }

  return items;
}

function AdminLayoutContent({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const { collapsed } = useSidebar();
  const breadcrumbs = buildAdminBreadcrumbs(pathname);

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      <main id="main-content" className={`transition-all duration-300 min-h-screen ${collapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="p-8">
          {breadcrumbs.length > 0 && (
            <Breadcrumbs items={breadcrumbs} className="mb-4" />
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Don't protect the login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoginPage) {
        setIsLoading(false);
        setIsAuthenticated(true); // Allow login page
        return;
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/admin/login');
        return;
      }

      // Verify user is an admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (!adminUser) {
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        router.push('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, pathname, isLoginPage]);

  // Show loading spinner while checking auth
  if (isLoading && !isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Login page doesn't get the admin nav
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <AdminLayoutContent pathname={pathname}>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
