import type { Metadata } from 'next';
import './globals.css';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import ToastProvider from '@/components/providers/ToastProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DemoBanner from '@/components/DemoBanner';
import { getSettings } from '@/lib/api';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    title: settings?.company_name || 'Trust Center',
    description: settings?.hero_subtitle || 'Security and compliance documentation',
    icons: settings?.favicon_url ? {
      icon: settings.favicon_url,
      shortcut: settings.favicon_url,
      apple: settings.favicon_url,
    } : undefined,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded-md focus:shadow-lg"
        >
          Skip to main content
        </a>
        <DemoBanner />
        <ConditionalLayout header={<Header />} footer={<Footer />}>
          {children}
          <ToastProvider />
        </ConditionalLayout>
      </body>
    </html>
  );
}
