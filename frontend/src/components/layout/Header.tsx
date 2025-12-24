import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Trust Center
          </Link>
          <div className="flex gap-4">
            <Link href="/certifications">Certifications</Link>
            <Link href="/security-updates">Security Updates</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

