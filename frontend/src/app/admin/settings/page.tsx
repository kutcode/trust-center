'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiRequestWithAuth } from '@/lib/api';
import { TrustCenterSettings } from '@/types';
import toast from 'react-hot-toast';

// Popular Google Fonts
const googleFonts = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Outfit',
  'DM Sans',
  'Plus Jakarta Sans',
  'Nunito',
  'Source Sans Pro',
  'Work Sans',
];

interface FooterLink {
  label: string;
  url: string;
}

export default function SettingsAdminPage() {
  const [settings, setSettings] = useState<Partial<TrustCenterSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'footer'>('general');

  // Footer links state
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);

  // File upload refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setToken(session.access_token);
        try {
          const data = await apiRequestWithAuth<TrustCenterSettings>('/api/admin/settings', session.access_token);
          setSettings(data);
          setFooterLinks(data.footer_links || []);
        } catch (error) {
          console.error('Failed to load settings:', error);
          toast.error('Failed to load settings');
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

    try {
      await apiRequestWithAuth('/api/admin/settings', token, {
        method: 'PATCH',
        body: JSON.stringify({
          ...settings,
          footer_links: footerLinks,
        }),
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'branding');
    formData.append('path', 'logo');

    const toastId = toast.loading('Uploading logo...');
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setSettings({ ...settings, company_logo_url: data.url });
      toast.success('Logo uploaded', { id: toastId });
    } catch (error) {
      toast.error('Failed to upload logo', { id: toastId });
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'branding');
    formData.append('path', 'favicon');

    const toastId = toast.loading('Uploading favicon...');
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setSettings({ ...settings, favicon_url: data.url });
      toast.success('Favicon uploaded', { id: toastId });
    } catch (error) {
      toast.error('Failed to upload favicon', { id: toastId });
    }
  };

  const addFooterLink = () => {
    setFooterLinks([...footerLinks, { label: '', url: '' }]);
  };

  const updateFooterLink = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...footerLinks];
    updated[index][field] = value;
    setFooterLinks(updated);
  };

  const removeFooterLink = (index: number) => {
    setFooterLinks(footerLinks.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trust Center Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Customize your Trust Center's appearance and branding
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { id: 'general', label: 'General' },
            { id: 'branding', label: 'Branding & Colors' },
            { id: 'footer', label: 'Footer & Links' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.company_name || ''}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={settings.contact_email || ''}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Hero Title
                </label>
                <input
                  type="text"
                  value={settings.hero_title || ''}
                  onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Hero Subtitle
                </label>
                <input
                  type="text"
                  value={settings.hero_subtitle || ''}
                  onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  About Section (HTML supported)
                </label>
                <textarea
                  rows={6}
                  value={settings.about_section || ''}
                  onChange={(e) => setSettings({ ...settings, about_section: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="<h2>About Our Security...</h2><p>We take security seriously...</p>"
                />
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-8">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Company Logo
                </label>
                <div className="flex items-start gap-6">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {settings.company_logo_url ? (
                      <img src={settings.company_logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <span className="text-gray-400 text-sm">No logo</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Upload Logo
                    </button>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, or SVG. Max 2MB.</p>
                    <input
                      type="text"
                      value={settings.company_logo_url || ''}
                      onChange={(e) => setSettings({ ...settings, company_logo_url: e.target.value })}
                      placeholder="Or enter URL directly..."
                      className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Favicon Upload */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Favicon
                </label>
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {settings.favicon_url ? (
                      <img src={settings.favicon_url} alt="Favicon" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-gray-400 text-xs">None</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={faviconInputRef}
                      accept="image/*"
                      onChange={handleFaviconUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => faviconInputRef.current?.click()}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Upload Favicon
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Square image, ideally 32x32 or 64x64.</p>
                    <input
                      type="text"
                      value={settings.favicon_url || ''}
                      onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                      placeholder="Or enter URL directly..."
                      className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Font Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Font Family
                </label>
                <select
                  value={settings.font_family || 'Inter'}
                  onChange={(e) => setSettings({ ...settings, font_family: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {googleFonts.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">Uses Google Fonts. Changes apply site-wide.</p>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.primary_color || '#111827'}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color || '#111827'}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.secondary_color || '#3b82f6'}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                      className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color || '#3b82f6'}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.accent_color || '#2563eb'}
                      onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                      className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.accent_color || '#2563eb'}
                      onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Tab */}
          {activeTab === 'footer' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={settings.footer_text || ''}
                  onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                  placeholder="© 2024 Your Company. All rights reserved."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Footer Links
                  </label>
                  <button
                    type="button"
                    onClick={addFooterLink}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Link
                  </button>
                </div>

                {footerLinks.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 text-sm">No footer links added</p>
                    <button
                      type="button"
                      onClick={addFooterLink}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Add your first link
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {footerLinks.map((link, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateFooterLink(index, 'label', e.target.value)}
                          placeholder="Label (e.g., Privacy Policy)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateFooterLink(index, 'url', e.target.value)}
                          placeholder="URL (e.g., /privacy)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => removeFooterLink(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.support_email || ''}
                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                    placeholder="support@yourcompany.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    NDA Document URL
                  </label>
                  <input
                    type="url"
                    value={settings.nda_url || ''}
                    onChange={(e) => setSettings({ ...settings, nda_url: e.target.value })}
                    placeholder="https://example.com/nda.pdf"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Users must accept this NDA before requesting documents. Leave blank to disable.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

