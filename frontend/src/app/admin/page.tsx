import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

async function getStats() {
  const supabase = createClient();
  
  try {
    const [requests, organizations, documents] = await Promise.all([
      supabase.from('document_requests').select('status'),
      supabase.from('organizations').select('approved_document_ids'),
      supabase.from('documents').select('id'),
    ]);

    return {
      pendingRequests: requests.data?.filter((r: any) => r.status === 'pending').length || 0,
      totalOrganizations: organizations.data?.length || 0,
      approvedOrganizations: organizations.data?.filter((o: any) => o.approved_document_ids?.length > 0).length || 0,
      totalDocuments: documents.data?.length || 0,
    };
  } catch {
    return {
      pendingRequests: 0,
      totalOrganizations: 0,
      approvedOrganizations: 0,
      totalDocuments: 0,
    };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Pending Requests</h3>
          <p className="text-3xl font-bold">{stats.pendingRequests}</p>
          <Link href="/admin/requests" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Organizations</h3>
          <p className="text-3xl font-bold">{stats.totalOrganizations}</p>
          <Link href="/admin/organizations" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Approved Organizations</h3>
          <p className="text-3xl font-bold">{stats.approvedOrganizations}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Documents</h3>
          <p className="text-3xl font-bold">{stats.totalDocuments}</p>
          <Link href="/admin/documents" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            Manage →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
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
      </div>
    </div>
  );
}

