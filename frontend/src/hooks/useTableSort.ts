import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

type SortValue = string | number | boolean | Date | null | undefined;
type SortAccessor<T> = keyof T | ((item: T) => SortValue);

function normalize(value: SortValue): string | number {
  if (value == null) return '';
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value;
  return String(value).toLowerCase();
}

export function useTableSort<T>(
  items: T[],
  defaultField: SortAccessor<T>,
  defaultDirection: SortDirection = 'asc'
) {
  const [sortField, setSortField] = useState<SortAccessor<T>>(defaultField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

  const sortedItems = useMemo(() => {
    const getValue = (item: T, accessor: SortAccessor<T>) =>
      typeof accessor === 'function' ? accessor(item) : (item[accessor] as SortValue);

    return [...items].sort((a, b) => {
      const av = normalize(getValue(a, sortField));
      const bv = normalize(getValue(b, sortField));

      let result = 0;
      if (av < bv) result = -1;
      else if (av > bv) result = 1;

      return sortDirection === 'asc' ? result : -result;
    });
  }, [items, sortDirection, sortField]);

  const toggleSort = (field: SortAccessor<T>) => {
    const sameField = sortField === field;
    if (sameField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection('asc');
  };

  return {
    sortedItems,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    toggleSort,
  };
}

