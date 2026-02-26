import { apiRequest } from '@/lib/api';
import { TrustCenterSettings, Document, DocumentCategory } from '@/types';
import HomePageClient from '@/components/HomePageClient';

async function getSettings(): Promise<TrustCenterSettings> {
  try {
    return await apiRequest<TrustCenterSettings>('/api/settings');
  } catch {
    return {
      id: 'default',
      primary_color: '#111827',
      secondary_color: '#3b82f6',
      hero_title: 'Security & Trust',
      hero_subtitle: 'Learn about our commitment to keeping your data safe and secure',
    };
  }
}

async function getDocuments(): Promise<Document[]> {
  try {
    return await apiRequest<Document[]>('/api/documents');
  } catch {
    return [];
  }
}

async function getCategories(): Promise<DocumentCategory[]> {
  try {
    return await apiRequest<DocumentCategory[]>('/api/document-categories');
  } catch {
    return [];
  }
}

async function getCertifications() {
  try {
    return await apiRequest<any[]>('/api/certifications');
  } catch {
    return [];
  }
}

async function getControlCategories() {
  try {
    return await apiRequest<any[]>('/api/control-categories');
  } catch {
    return [];
  }
}

async function getSecurityUpdates() {
  try {
    return await apiRequest<any[]>('/api/security-updates');
  } catch {
    return [];
  }
}

export default async function Home() {
  const [settings, documents, categories, certifications, controlCategories, securityUpdates, controls] = await Promise.all([
    getSettings(),
    getDocuments(),
    getCategories(),
    getCertifications(),
    getControlCategories(),
    getSecurityUpdates(),
    apiRequest<any[]>('/api/controls').catch(() => []),
  ]);

  const publishedDocs = documents.filter(doc => doc.status === 'published');

  return (
    <HomePageClient
      settings={settings}
      publishedDocs={publishedDocs}
      categories={categories}
      certifications={certifications}
      controlCategories={controlCategories}
      securityUpdates={securityUpdates}
      controls={controls}
    />
  );
}
