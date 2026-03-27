import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Only protect admin routes (except the login page itself)
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow the login page through
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  // If Supabase env vars are not configured, fall through to client-side auth
  // Prefer SUPABASE_URL (Docker-internal) over NEXT_PUBLIC_SUPABASE_URL (browser-facing localhost)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  try {
    const response = NextResponse.next();

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    // If Supabase is unreachable or returns an error, fall through to client-side auth
    if (error) {
      console.warn('Middleware auth check failed, falling through:', error.message);
      return NextResponse.next();
    }

    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  } catch (err) {
    // If anything goes wrong (network issues, bad URL, etc.), don't block the request
    console.warn('Middleware error, falling through to client-side auth:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
