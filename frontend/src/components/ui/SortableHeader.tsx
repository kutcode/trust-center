import { SortDirection } from '@/hooks/useTableSort';

interface SortableHeaderProps {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  className?: string;
}

export default function SortableHeader({
  label,
  active,
  direction,
  onClick,
  className = '',
}: SortableHeaderProps) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none ${className}`}
    >
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-gray-700"
        aria-label={`Sort by ${label}`}
      >
        <span>{label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${active && direction === 'desc' ? 'rotate-180' : ''} ${
            active ? 'opacity-100' : 'opacity-40'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </th>
  );
}

