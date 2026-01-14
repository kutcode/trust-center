import { TrustCenterSettings } from '@/types';
import { cache } from 'react';

// Use different URLs for server-side (Docker network) vs client-side (browser)
const getApiUrl = () => {
  // Check if we're on the server
  if (typeof window === 'undefined') {
    // Server-side: use Docker network URL
    return process.env.API_URL || 'http://trust-center-backend:4000';
  }
  // Client-side: use public URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const API_URL = getApiUrl();
  const url = `${API_URL}${endpoint}`;

  // Merge headers ensuring Content-Type is set for JSON requests
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Only set Content-Type if body is a string (JSON) and not FormData
  if (options.body && typeof options.body === 'string') {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function apiRequestWithAuth<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

// Cached settings fetch - React cache deduplicates during a single render
export const getSettings = cache(async (): Promise<TrustCenterSettings | null> => {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/api/settings`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
});
