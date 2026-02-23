interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0 || totalPages <= 1) return null;

  const pages: number[] = [];
  const min = Math.max(1, page - 2);
  const max = Math.min(totalPages, page + 2);
  for (let p = min; p <= max; p += 1) pages.push(p);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Showing <span className="font-medium text-gray-900 dark:text-gray-100">{startIndex}</span> to{' '}
        <span className="font-medium text-gray-900 dark:text-gray-100">{endIndex}</span> of{' '}
        <span className="font-medium text-gray-900 dark:text-gray-100">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>

        {min > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              1
            </button>
            {min > 2 && <span className="px-1 text-gray-400 dark:text-gray-500">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 text-sm rounded border ${
              p === page
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        ))}

        {max < totalPages && (
          <>
            {max < totalPages - 1 && <span className="px-1 text-gray-400 dark:text-gray-500">...</span>}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
