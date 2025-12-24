import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Just pass through - auth is handled client-side
  return NextResponse.next();
}

export const config = {
  matcher: [],  // Disable middleware entirely
};

