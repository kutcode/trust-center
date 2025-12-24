import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import LogoutButton from '@/components/admin/LogoutButton';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, let login page handle it (don't redirect here to avoid loop)
  // The middleware will handle redirects for other admin pages
  if (session) {
    // Verify admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', session.user.id)
      .single();

    if (!adminUser) {
      redirect('/');
    }
  }

  // Render admin layout with nav (login page will override with its own layout)
  return (
    <div className="min-h-screen bg-gray-50">
      {session && (
        <nav className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link href="/admin" className="text-xl font-bold">
                  Admin Console
                </Link>
                <div className="flex gap-4">
                  <Link href="/admin/documents" className="text-gray-600 hover:text-gray-900">
                    Documents
                  </Link>
                  <Link href="/admin/requests" className="text-gray-600 hover:text-gray-900">
                    Requests
                  </Link>
                  <Link href="/admin/organizations" className="text-gray-600 hover:text-gray-900">
                    Organizations
                  </Link>
                <Link href="/admin/settings" className="text-gray-600 hover:text-gray-900">
                  Settings
                </Link>
                <Link href="/admin/users" className="text-gray-600 hover:text-gray-900">
                  Users
                </Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  View Site
                </Link>
                <LogoutButton />
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className={session ? "container mx-auto px-4 py-8" : ""}>{children}</main>
    </div>
  );
}
