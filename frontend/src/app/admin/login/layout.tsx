export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No authentication check for login page
  return <>{children}</>;
}

