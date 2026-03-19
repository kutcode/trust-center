import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware intentionally passes all requests through.
// Admin route protection is handled client-side via AuthContext.
// If server-side auth checks are needed in the future,
// implement them here with Supabase SSR session validation.
//
// See: https://supabase.com/docs/guides/auth/server-side/nextjs

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// No routes are matched — middleware is effectively disabled.
export const config = {
  matcher: [],
};
