import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
            Trust Center
          </Link>
          <div className="flex gap-6">
            <Link href="/documents" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Documents
            </Link>
            <Link href="/certifications" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Certifications
            </Link>
            <Link href="/security-updates" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Security Updates
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Contact
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

