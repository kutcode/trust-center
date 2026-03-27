import LoginClient from './LoginClient';

export default function AdminLoginPage() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@trustcenter.io';
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'demo123';

  return (
    <LoginClient
      isDemoMode={isDemoMode}
      demoEmail={demoEmail}
      demoPassword={demoPassword}
    />
  );
}
