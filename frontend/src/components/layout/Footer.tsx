import { getSettings } from '@/lib/api';
import Link from 'next/link';

export default async function Footer() {
  const settings = await getSettings();

  const footerText = settings?.footer_text || `© ${new Date().getFullYear()} ${settings?.company_name || 'Trust Center'}. All rights reserved.`;
  const footerLinks = settings?.footer_links || [];

  return (
    <footer
      className="mt-auto border-t border-gray-200 dark:border-slate-800"
      style={{ backgroundColor: settings?.primary_color ? `${settings.primary_color}10` : '#f9fafb' }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Footer Links */}
        {footerLinks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            {footerLinks.map((link, index) => (
              <Link
                key={index}
                href={link.url}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                style={{
                  color: settings?.secondary_color || undefined
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Footer Text */}
        <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
          {footerText}
        </p>

        {/* Social Links */}
        {settings?.social_links && Object.keys(settings.social_links).length > 0 && (
          <div className="flex justify-center gap-4 mt-4">
            {Object.entries(settings.social_links).map(([platform, url]) => (
              <a
                key={platform}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
