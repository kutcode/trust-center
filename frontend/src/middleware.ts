import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware passes all requests through.
// Admin route protection is handled client-side via AuthContext.
// Server-side middleware auth is disabled for Docker environments where
// the Supabase URL (localhost:8000) is not reachable from the container.

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
