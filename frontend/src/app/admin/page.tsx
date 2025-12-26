'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequestWithAuth } from '@/lib/api';

interface Stats {
  pendingRequests: number;
  totalOrganizations: number;
  openTickets: number;
  totalDocuments: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    pendingRequests: 0,
    totalOrganizations: 0,
    openTickets: 0,
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.full_name || user?.email}</p>
        </div>
        <Link
          href="/admin/documents/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Document
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/requests"
          className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
          <p className="text-sm text-gray-500">Pending Requests</p>
        </Link>

        <Link
          href="/admin/organizations"
          className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrganizations}</p>
          <p className="text-sm text-gray-500">Organizations</p>
        </Link>

        <Link
          href="/admin/tickets"
          className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
          <p className="text-sm text-gray-500">Open Tickets</p>
        </Link>

        <Link
          href="/admin/documents"
          className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
          <p className="text-sm text-gray-500">Documents</p>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/admin/requests"
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Review Requests</p>
              <p className="text-xs text-gray-500">{stats.pendingRequests} pending</p>
            </div>
          </Link>

          <Link
            href="/admin/tickets"
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Support Tickets</p>
              <p className="text-xs text-gray-500">View conversations</p>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Settings</p>
              <p className="text-xs text-gray-500">Customize site</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
