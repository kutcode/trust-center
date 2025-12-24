'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { TrustCenterSettings } from '@/types';

export default function SettingsAdminPage() {
  const [settings, setSettings] = useState<Partial<TrustCenterSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setToken(session.access_token);
        try {
          const data = await apiRequestWithAuth<TrustCenterSettings>('/api/admin/settings', session.access_token);
          setSettings(data);
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setSuccess(false);

    try {
      await apiRequestWithAuth('/api/admin/settings', token, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-900">Loading...</div>;
  }

  return (
    <>
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Trust Center Settings</h1>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          Settings saved successfully!
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium mb-2 text-gray-700">
            Company Name
          </label>
          <input
            type="text"
            id="company_name"
            value={settings.company_name || ''}
            onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="hero_title" className="block text-sm font-medium mb-2 text-gray-700">
            Hero Title
          </label>
          <input
            type="text"
            id="hero_title"
            value={settings.hero_title || ''}
            onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="hero_subtitle" className="block text-sm font-medium mb-2 text-gray-700">
            Hero Subtitle
          </label>
          <input
            type="text"
            id="hero_subtitle"
            value={settings.hero_subtitle || ''}
            onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="primary_color" className="block text-sm font-medium mb-2 text-gray-700">
            Primary Color
          </label>
          <input
            type="color"
            id="primary_color"
            value={settings.primary_color || '#007bff'}
            onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
            className="w-full h-10 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="secondary_color" className="block text-sm font-medium mb-2 text-gray-700">
            Secondary Color
          </label>
          <input
            type="color"
            id="secondary_color"
            value={settings.secondary_color || '#6c757d'}
            onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
            className="w-full h-10 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium mb-2 text-gray-700">
            Contact Email
          </label>
          <input
            type="email"
            id="contact_email"
            value={settings.contact_email || ''}
            onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="about_section" className="block text-sm font-medium mb-2 text-gray-700">
            About Section
          </label>
          <textarea
            id="about_section"
            rows={6}
            value={settings.about_section || ''}
            onChange={(e) => setSettings({ ...settings, about_section: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            placeholder="HTML content for about section"
          />
        </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </>
  );
}

