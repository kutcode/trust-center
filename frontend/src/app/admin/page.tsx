'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequestWithAuth } from '@/lib/api';

interface Stats {
  pendingRequests: number;
  totalOrganizations: number;
  approvedOrganizations: number;
  totalDocuments: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    pendingRequests: 0,
    totalOrganizations: 0,
    approvedOrganizations: 0,
    totalDocuments: 0,
  });

  async function loadStats(token: string) {
    try {
      const data = await apiRequestWithAuth<Stats>('/api/admin/stats', token);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/admin/login');
        return;
      }

      // Verify admin status
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id, email, full_name, role')
        .eq('id', session.user.id)
        .single();

      if (!adminUser) {
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      setUser(adminUser);

      // Load stats from API
      await loadStats(session.access_token);

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  // Refresh stats when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await loadStats(session.access_token);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-900 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Pending Requests</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingRequests}</p>
            <Link href="/admin/requests" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Organizations</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalOrganizations}</p>
            <Link href="/admin/organizations" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Approved Organizations</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.approvedOrganizations}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Documents</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalDocuments}</p>
            <Link href="/admin/documents" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Manage →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/admin/documents/new"
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-700"
              >
                Upload New Document
              </Link>
              <Link
                href="/admin/requests"
                className="block w-full bg-green-600 text-white px-4 py-2 rounded-lg text-center hover:bg-green-700"
              >
                Review Pending Requests
              </Link>
              <Link
                href="/admin/organizations"
                className="block w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-center hover:bg-purple-700"
              >
                Manage Organizations
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Logged in as</h2>
            <p className="text-gray-700"><strong>Email:</strong> {user?.email}</p>
            <p className="text-gray-700"><strong>Name:</strong> {user?.full_name || 'N/A'}</p>
            <p className="text-gray-700"><strong>Role:</strong> {user?.role}</p>
          </div>
        </div>
    </>
  );
}
