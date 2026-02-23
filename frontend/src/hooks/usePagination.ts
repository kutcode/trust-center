import { useEffect, useMemo, useState } from 'react';

export function usePagination<T>(items: T[], perPage = 10) {
  const [page, setPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [perPage]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, page, perPage]);

  const startIndex = totalItems === 0 ? 0 : (page - 1) * perPage + 1;
  const endIndex = totalItems === 0 ? 0 : Math.min(page * perPage, totalItems);

  return {
    page,
    setPage,
    perPage,
    totalItems,
    totalPages,
    paginatedItems,
    startIndex,
    endIndex,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

