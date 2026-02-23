import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-gray-700 dark:hover:text-gray-200">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-gray-900 dark:text-gray-100 font-medium' : ''}>{item.label}</span>
              )}
              {!isLast && <span className="text-gray-400 dark:text-gray-600">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
