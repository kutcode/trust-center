'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface UseQueryParamOptions {
  defaultValue?: string | null;
  replace?: boolean;
}

export function useQueryParam(key: string, options: UseQueryParamOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = searchParams.get(key) ?? options.defaultValue ?? null;

  const setValue = useCallback(
    (nextValue: string | null | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      const normalizedValue = nextValue?.trim() ?? '';

      if (!normalizedValue) {
        params.delete(key);
      } else {
        params.set(key, normalizedValue);
      }

      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;

      if (options.replace ?? true) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [key, options.replace, pathname, router, searchParams]
  );

  return [value, setValue] as const;
}
