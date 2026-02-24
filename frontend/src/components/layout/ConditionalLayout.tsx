'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface ConditionalLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

export default function ConditionalLayout({
  children,
  header,
  footer,
}: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    // Admin routes have their own layout with AdminNav
    return <div className="flex-grow">{children}</div>;
  }

  // Public routes get Header and Footer
  return (
    <>
      {header}
      <main id="main-content" className="flex-grow">
        {children}
      </main>
      {footer}
    </>
  );
}
