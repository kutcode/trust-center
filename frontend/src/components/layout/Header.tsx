import { getSettings } from '@/lib/api';
import HeaderClient from './HeaderClient';

export default async function Header() {
  const settings = await getSettings();

  return (
    <HeaderClient
      companyName={settings?.company_name || 'Trust Center'}
      primaryColor={settings?.primary_color || '#111827'}
      logoUrl={settings?.company_logo_url}
    />
  );
}
